from datetime import datetime, timedelta
from . import db
import os


class Subscription(db.Model):
    __tablename__ = 'subscriptions'
    
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    
    # Stripe information
    stripe_customer_id = db.Column(db.String(100), nullable=True)
    stripe_subscription_id = db.Column(db.String(100), nullable=True)
    
    # Primary subscription details (highest tier plan name for display)
    plan_name = db.Column(db.String(50), nullable=False, default='trial')
    billing_cycle = db.Column(db.String(20), nullable=False, default='monthly')
    status = db.Column(db.String(20), default='trial')
    
    # CUMULATIVE usage limits from ALL active plans (including trial)
    total_projects_allowed = db.Column(db.Integer, default=3)
    total_users_allowed = db.Column(db.Integer, default=1)
    total_storage_mb_allowed = db.Column(db.Integer, default=500)
    total_api_rate_limit = db.Column(db.Integer, default=50)
    
    # Current period usage tracking
    projects_used_this_period = db.Column(db.Integer, default=0)
    storage_used_mb = db.Column(db.Integer, default=0)
    
    # Trial management - NEVER REMOVED, always preserved
    trial_start = db.Column(db.DateTime, default=datetime.utcnow)
    trial_end = db.Column(db.DateTime, default=lambda: datetime.utcnow() + timedelta(days=7))
    trial_projects_used = db.Column(db.Integer, default=0)
    
    # Subscription period management (for billing purposes)
    current_period_start = db.Column(db.DateTime, nullable=True)
    current_period_end = db.Column(db.DateTime, nullable=True)
    
    # Cancellation management
    cancelled_at = db.Column(db.DateTime, nullable=True)
    will_cancel_at_period_end = db.Column(db.Boolean, default=False)
    
    # Payment tracking
    failed_payment_count = db.Column(db.Integer, default=0)
    last_payment_failure = db.Column(db.DateTime, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = db.relationship('Company', back_populates='subscription')
    subscription_purchases = db.relationship('SubscriptionPurchase', back_populates='subscription', 
                                           cascade='all, delete-orphan')
    
    def recalculate_limits(self):
        """Recalculate CUMULATIVE limits from trial + all active purchases"""
        now = datetime.utcnow()
        
        # Start with base trial benefits (always available during trial period)
        trial_benefits = {
            'projects': 3,
            'users': 1, 
            'storage': 500,
            'api_limit': 50
        }
        
        # Get all active (non-expired) purchases
        active_purchases = [p for p in self.subscription_purchases 
                          if p.is_active and p.end_date > now]
        
        # Check if trial is still valid
        trial_active = now <= self.trial_end
        has_paid_plans = len(active_purchases) > 0
        
        # FIXED LOGIC: Always start with 0, then add benefits
        total_projects = 0
        total_users = 0
        total_storage = 0
        total_rate_limit = 0
        
        # Add trial benefits if trial is active
        if trial_active:
            total_projects += trial_benefits['projects']
            total_users += trial_benefits['users']
            total_storage += trial_benefits['storage']
            total_rate_limit += trial_benefits['api_limit']
        
        # Add benefits from all active purchases
        for purchase in active_purchases:
            plan = SUBSCRIPTION_PLANS.get(purchase.plan_name, {})
            
            # Handle unlimited (-1) values
            projects_benefit = plan.get('max_projects', 0)
            users_benefit = plan.get('max_users', 0)
            storage_benefit = plan.get('max_storage_mb', 0)
            api_benefit = plan.get('api_rate_limit', 0)
            
            if projects_benefit == -1:
                total_projects = -1  # Unlimited overrides everything
            elif total_projects != -1:
                total_projects += projects_benefit
            
            if users_benefit == -1:
                total_users = -1
            elif total_users != -1:
                total_users += users_benefit
            
            if storage_benefit == -1:
                total_storage = -1
            elif total_storage != -1:
                total_storage += storage_benefit
            
            if api_benefit == -1:
                total_rate_limit = -1
            elif total_rate_limit != -1:
                total_rate_limit += api_benefit
        
        # If no active benefits, user has no access
        if not trial_active and not has_paid_plans:
            total_projects = 0
            total_users = 0
            total_storage = 0
            total_rate_limit = 0
            
        # Update the subscription limits
        self.total_projects_allowed = total_projects
        self.total_users_allowed = total_users
        self.total_storage_mb_allowed = total_storage
        self.total_api_rate_limit = total_rate_limit
        
        # Update status based on active benefits
        if not trial_active and not has_paid_plans:
            self.status = 'expired'
        elif has_paid_plans:
            # Set plan_name to highest tier active plan
            active_plan_names = [p.plan_name for p in active_purchases]
            plan_priority = {'starter': 1, 'professional': 2, 'enterprise': 3}
            highest_tier = max(active_plan_names, key=lambda x: plan_priority.get(x, 0))
            self.plan_name = highest_tier
            self.status = 'active'
        elif trial_active:
            self.plan_name = 'trial'
            self.status = 'trial'
    
    @property
    def is_active(self):
        """Check if subscription allows system access (trial OR paid plans)"""
        now = datetime.utcnow()
        
        # Check if trial is still valid
        trial_active = now <= self.trial_end
        
        # Check if any purchases are active  
        active_purchases = [p for p in self.subscription_purchases 
                          if p.is_active and p.end_date > now]
        has_active_purchases = len(active_purchases) > 0
        
        return trial_active or has_active_purchases
    
    @property
    def days_remaining(self):
        """Get days remaining until user loses ALL access"""
        now = datetime.utcnow()
        
        # Get all active end dates (trial + purchases)
        end_dates = []
        
        # Include trial end date if trial hasn't expired
        if now <= self.trial_end:
            end_dates.append(self.trial_end)
            
        # Include all active purchase end dates
        active_purchases = [p for p in self.subscription_purchases 
                          if p.is_active and p.end_date > now]
        for purchase in active_purchases:
            end_dates.append(purchase.end_date)
        
        if not end_dates:
            return 0
            
        # Return days until the LATEST expiration
        latest_end = max(end_dates)

        return self._calculate_days_between(now, latest_end)
    
    @property 
    def trial_days_remaining(self):
        """Get remaining trial days specifically"""
        now = datetime.utcnow()

        if now > self.trial_end:
            return 0
        
        return self._calculate_days_between(now, self.trial_end)
    
    def _calculate_days_between(self, start_date, end_date):
        """Calculate full days between two dates, rounding up partial days"""
        if end_date <= start_date:
            return 0
        
        # Ensure both dates are datetime objects with same timezone handling
        if isinstance(start_date, datetime):
            start = start_date.replace(tzinfo=None)
        else:
            start = start_date
            
        if isinstance(end_date, datetime):
            end = end_date.replace(tzinfo=None)
        else:
            end = end_date
        
        # Calculate the difference
        delta = end - start
        
        # If less than 24 hours remaining, return 0 days
        if delta.total_seconds() < 86400:  # 24 hours in seconds
            return 0
        
        # Calculate full days remaining
        # Use total_seconds to get precise calculation
        total_seconds = delta.total_seconds()
        full_days = int(total_seconds // 86400)
        
        # If there are remaining hours that constitute a partial day,
        # we still have that day available
        remaining_seconds = total_seconds % 86400
        if remaining_seconds > 0:
            full_days += 1
        
        return full_days
    
    def can_create_project(self):
        """Check if user can create new projects"""
        if not self.is_active:
            return False
        
        # Check if projects_used_this_period is None and initialize
        if self.projects_used_this_period is None:
            self.projects_used_this_period = 0
            try:
                from . import db
                db.session.commit()
            except:
                pass
        
        if self.total_projects_allowed == -1:  # Unlimited
            return True
        
        if self.total_projects_allowed <= 0:  # No access
            return False
            
        return self.projects_used_this_period < self.total_projects_allowed
    
    def can_add_user(self, current_user_count):
        """Check if more users can be added"""
        if not self.is_active:
            return False
        
        if self.total_users_allowed == -1:  # Unlimited
            return True
        
        return current_user_count < self.total_users_allowed
    
    def get_active_plans(self):
        """Get list of currently active plan names including trial"""
        now = datetime.utcnow()
        plans = []
        
        # Include trial if still active
        if now <= self.trial_end:
            plans.append('trial')
            
        # Include active purchases
        active_purchases = [p for p in self.subscription_purchases 
                          if p.is_active and p.end_date > now]
        plans.extend([p.plan_name for p in active_purchases])
        
        return list(set(plans))  # Remove duplicates
    
    def get_access_summary(self):
        """Get detailed breakdown of user's current access"""
        now = datetime.utcnow()
        
        trial_active = now <= self.trial_end
        active_purchases = [p for p in self.subscription_purchases 
                          if p.is_active and p.end_date > now]
        
        # Get expiry dates for display
        expiry_info = []
        if trial_active:
            expiry_info.append({
                'type': 'trial',
                'expires': self.trial_end.isoformat(),
                'days_remaining': self.trial_days_remaining
            })
        
        for purchase in active_purchases:
            expiry_info.append({
                'type': 'subscription',
                'plan_name': purchase.plan_name,
                'expires': purchase.end_date.isoformat(),
                'days_remaining': purchase.days_remaining,
                'billing_cycle': purchase.billing_cycle
            })
        
        return {
            'trial_active': trial_active,
            'trial_days_remaining': self.trial_days_remaining,
            'active_purchases_count': len(active_purchases),
            'active_plans': self.get_active_plans(),
            'total_access_days': self.days_remaining,
            'has_unlimited_projects': self.total_projects_allowed == -1,
            'effective_limits': {
                'projects': self.total_projects_allowed,
                'users': self.total_users_allowed,
                'storage_mb': self.total_storage_mb_allowed,
                'api_rate_limit': self.total_api_rate_limit
            },
            'current_usage': {
                'projects_used': self.projects_used_this_period,
                'storage_used_mb': self.storage_used_mb,
                'usage_percentage': self.get_usage_percentage()
            },
            'expiry_details': expiry_info
        }
    
    def get_usage_percentage(self):
        """Get project usage as percentage"""
        if self.total_projects_allowed == -1 or self.total_projects_allowed <= 0:
            return 0
        return min((self.projects_used_this_period / self.total_projects_allowed) * 100, 100)
    
    def get_next_expiry_date(self):
        """Get the next expiring subscription/trial"""
        now = datetime.utcnow()
        
        upcoming_expiries = []
        
        # Add trial expiry if still active
        if now <= self.trial_end:
            upcoming_expiries.append({
                'type': 'trial',
                'date': self.trial_end,
                'days_remaining': self.trial_days_remaining
            })
        
        # Add active purchase expiries
        active_purchases = [p for p in self.subscription_purchases 
                          if p.is_active and p.end_date > now]
        for purchase in active_purchases:
            upcoming_expiries.append({
                'type': 'subscription',
                'plan_name': purchase.plan_name,
                'date': purchase.end_date,
                'days_remaining': purchase.days_remaining
            })
        
        if not upcoming_expiries:
            return None
        
        # Return the next expiring item
        return min(upcoming_expiries, key=lambda x: x['date'])
    
    
    def increment_project_usage(self):
        """Increment project usage counter"""
        self.projects_used_this_period = (self.projects_used_this_period or 0) + 1
        
        # Also track trial usage separately if trial is active
        now = datetime.utcnow()
        if now <= self.trial_end:
            self.trial_projects_used = (self.trial_projects_used or 0) + 1

        # Mark the subscription as updated
        self.updated_at = datetime.utcnow()
        
        # CRITICAL: Explicitly commit to database
        try:
            from . import db
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            raise Exception(f"Failed to update project usage: {str(e)}")
    
    def reset_usage_for_new_period(self):
        """FIXED: Proper usage reset with database persistence"""
        old_usage = self.projects_used_this_period
        self.projects_used_this_period = 0
        self.updated_at = datetime.utcnow()
        
        # Log the reset for debugging
        try:
            import logging
            logging.info(f"Reset usage for subscription {self.id}: {old_usage} -> 0")
        except:
            pass
        
        # Commit to database
        try:
            from . import db
            db.session.commit()
        except Exception as e:
            db.session.rollback()
            raise Exception(f"Failed to reset usage period: {str(e)}")
    
    def to_dict(self):
        """FIXED: Enhanced to_dict with better data"""
        access_summary = self.get_access_summary()
        next_expiry = self.get_next_expiry_date()
        
        return {
            'id': self.id,
            'plan_name': self.plan_name,
            'billing_cycle': self.billing_cycle,
            'status': self.status,
            'is_active': self.is_active,
            
            # Cumulative limits
            'total_projects_allowed': self.total_projects_allowed,
            'total_users_allowed': self.total_users_allowed,
            'total_storage_mb_allowed': self.total_storage_mb_allowed,
            'total_api_rate_limit': self.total_api_rate_limit,
            
            # Current usage
            'projects_used_this_period': self.projects_used_this_period,
            'trial_projects_used': self.trial_projects_used,
            'storage_used_mb': self.storage_used_mb,
            'usage_percentage': self.get_usage_percentage(),
            
            # Time remaining
            'days_remaining': self.days_remaining,
            'trial_days_remaining': self.trial_days_remaining,
            'next_expiry': next_expiry,
            
            # Access details
            'active_plans': self.get_active_plans(),
            'can_create_project': self.can_create_project(),
            'is_trial': access_summary['trial_active'],
            'access_summary': access_summary,
            
            # Trial info
            'trial_start': self.trial_start.isoformat() if self.trial_start else None,
            'trial_end': self.trial_end.isoformat() if self.trial_end else None,
            
            # Subscription periods
            'current_period_start': self.current_period_start.isoformat() if self.current_period_start else None,
            'current_period_end': self.current_period_end.isoformat() if self.current_period_end else None
        }


class SubscriptionPurchase(db.Model):
    """Track individual subscription purchases/renewals"""
    __tablename__ = 'subscription_purchases'
    
    id = db.Column(db.Integer, primary_key=True)
    subscription_id = db.Column(db.Integer, db.ForeignKey('subscriptions.id'), nullable=False)
    
    # Purchase details
    plan_name = db.Column(db.String(50), nullable=False)
    billing_cycle = db.Column(db.String(20), nullable=False)
    
    # Stripe transaction details
    stripe_payment_intent_id = db.Column(db.String(100), nullable=True)
    stripe_subscription_id = db.Column(db.String(100), nullable=True)
    stripe_invoice_id = db.Column(db.String(100), nullable=True)
    
    # Financial details
    amount_paid = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(3), default='USD')
    
    # Subscription period - FIXED: These should extend from current time, not replace
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=False)
    
    # Status
    is_active = db.Column(db.Boolean, default=True)
    is_cancelled = db.Column(db.Boolean, default=False)
    cancelled_at = db.Column(db.DateTime, nullable=True)
    will_cancel_at_period_end = db.Column(db.Boolean, default=False)
    cancellation_requested_at = db.Column(db.DateTime, nullable=True)
    
    # Purchase metadata
    purchase_type = db.Column(db.String(20), default='new')
    upgraded_from_plan = db.Column(db.String(50), nullable=True)
    
    # Usage tracking for this specific purchase
    projects_used_from_this_purchase = db.Column(db.Integer, default=0)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    subscription = db.relationship('Subscription', back_populates='subscription_purchases')
    
    @property
    def is_expired(self):
        """Check if this purchase has expired"""
        return datetime.utcnow() > self.end_date
    
    @property
    def days_remaining(self):
        """FIXED: Accurate days remaining for this specific purchase"""
        now = datetime.utcnow()
        if self.end_date <= now:
            return 0
        
        # Use the same accurate calculation method
        subscription = self.subscription
        return subscription._calculate_days_between(now, self.end_date)
    
    @property 
    def plan_details(self):
        """Get plan details from config"""
        return SUBSCRIPTION_PLANS.get(self.plan_name, {})
    
    def to_dict(self):
        plan_details = self.plan_details
        
        return {
            'id': self.id,
            'plan_name': self.plan_name,
            'billing_cycle': self.billing_cycle,
            'amount_paid': self.amount_paid,
            'currency': self.currency,
            'start_date': self.start_date.isoformat(),
            'end_date': self.end_date.isoformat(),
            'is_active': self.is_active,
            'is_expired': self.is_expired,
            'days_remaining': self.days_remaining,
            'will_cancel_at_period_end': self.will_cancel_at_period_end,
            'purchase_type': self.purchase_type,
            'upgraded_from_plan': self.upgraded_from_plan,
            'projects_used_from_this_purchase': self.projects_used_from_this_purchase,
            'created_at': self.created_at.isoformat(),
            
            # Plan benefits this purchase provides
            'plan_benefits': {
                'max_projects': plan_details.get('max_projects', 0),
                'max_users': plan_details.get('max_users', 0),
                'max_storage_mb': plan_details.get('max_storage_mb', 0),
                'api_rate_limit': plan_details.get('api_rate_limit', 0),
                'features': plan_details.get('features', [])
            }
        }


class PaymentHistory(db.Model):
    """Track all payments and transactions"""
    __tablename__ = 'payment_history'
    
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    subscription_purchase_id = db.Column(db.Integer, db.ForeignKey('subscription_purchases.id'), nullable=True)
    
    # Payment details
    stripe_payment_intent_id = db.Column(db.String(100), nullable=True)
    stripe_charge_id = db.Column(db.String(100), nullable=True)
    stripe_invoice_id = db.Column(db.String(100), nullable=True)
    
    # Transaction info
    amount = db.Column(db.Float, nullable=False)
    currency = db.Column(db.String(3), default='USD')
    status = db.Column(db.String(20), nullable=False)
    
    # Payment method (no sensitive data)
    payment_method_type = db.Column(db.String(20), nullable=True)
    last_4_digits = db.Column(db.String(4), nullable=True)
    card_brand = db.Column(db.String(20), nullable=True)
    
    # Transaction metadata
    description = db.Column(db.String(255), nullable=True)
    plan_name = db.Column(db.String(50), nullable=True)
    billing_cycle = db.Column(db.String(20), nullable=True)
    
    # Failure info
    failure_code = db.Column(db.String(50), nullable=True)
    failure_message = db.Column(db.String(255), nullable=True)
    
    # Timestamps
    transaction_date = db.Column(db.DateTime, default=datetime.utcnow)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    company = db.relationship('Company')
    subscription_purchase = db.relationship('SubscriptionPurchase')
    
    def to_dict(self):
        return {
            'id': self.id,
            'amount': self.amount,
            'currency': self.currency,
            'status': self.status,
            'description': self.description,
            'plan_name': self.plan_name,
            'billing_cycle': self.billing_cycle,
            'payment_method_type': self.payment_method_type,
            'last_4_digits': self.last_4_digits,
            'card_brand': self.card_brand,
            'transaction_date': self.transaction_date.isoformat(),
            'failure_message': self.failure_message if self.status == 'failed' else None
        }


# Subscription plans configuration - FIXED: These are ADDITIONAL benefits, not total
SUBSCRIPTION_PLANS = {
    'trial': {
        'name': 'Trial',
        'price_monthly': 0,
        'price_yearly': 0,
        'max_projects': 3,
        'max_users': 1,
        'max_storage_mb': 500,
        'api_rate_limit': 50,
        'features': [
            '3 projects total',
            'Basic floor plan analysis', 
            '1 team member',
            '500MB storage',
            '7-day trial period'
        ]
    },
    'starter': {
        'name': 'Starter',
        'price_monthly': 9.99,
        'price_yearly': 90.99,
        'stripe_price_id_monthly': os.environ.get('STRIPE_STARTER_MONTHLY'),
        'stripe_price_id_yearly': os.environ.get('STRIPE_STARTER_YEARLY'),
        'max_projects': 5,  # ADDITIONAL 5 projects per month
        'max_users': 1,     # ADDITIONAL 1 user
        'max_storage_mb': 1000,  # ADDITIONAL 1GB storage
        'api_rate_limit': 100,   # ADDITIONAL 100 requests
        'features': [
            '5 additional projects per month',
            'Basic floor plan analysis',
            'PDF quote generation', 
            '1 additional team member',
            'Email support',
            '1GB additional storage'
        ]
    },
    'professional': {
        'name': 'Professional',
        'price_monthly': 79.00,
        'price_yearly': 790.00,
        'stripe_price_id_monthly': os.environ.get('STRIPE_PRO_MONTHLY'),
        'stripe_price_id_yearly': os.environ.get('STRIPE_PRO_YEARLY'),
        'max_projects': 25,  # ADDITIONAL 25 projects
        'max_users': 10,     # ADDITIONAL 10 users
        'max_storage_mb': 5000,  # ADDITIONAL 5GB
        'api_rate_limit': 500,   # ADDITIONAL 500 requests
        'features': [
            '25 additional projects per month',
            'Advanced AI floor plan analysis',
            'Custom quote templates',
            '10 additional team members',
            'Priority email support',
            'Custom paint brand settings',
            '5GB additional storage',
            'API access'
        ]
    },
    'enterprise': {
        'name': 'Enterprise', 
        'price_monthly': 199,
        'price_yearly': 1990,
        'stripe_price_id_monthly': os.environ.get('STRIPE_ENTERPRISE_MONTHLY'),
        'stripe_price_id_yearly': os.environ.get('STRIPE_ENTERPRISE_YEARLY'),
        'max_projects': -1,  # Unlimited overrides everything
        'max_users': -1,     # Unlimited overrides everything
        'max_storage_mb': -1,
        'api_rate_limit': -1,
        'features': [
            'Unlimited projects',
            'Unlimited team members',
            'Advanced AI analysis',
            'Custom integrations',
            'Dedicated account manager',
            'Phone & priority support',
            'White-label options',
            'Unlimited storage',
            'Full API access',
            'Custom deployment'
        ]
    }
}