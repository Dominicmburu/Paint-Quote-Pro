from datetime import datetime, timedelta
from . import db

class Subscription(db.Model):
    __tablename__ = 'subscriptions'
    
    id = db.Column(db.Integer, primary_key=True)
    company_id = db.Column(db.Integer, db.ForeignKey('companies.id'), nullable=False)
    
    # Stripe information
    stripe_customer_id = db.Column(db.String(100), nullable=True)
    stripe_subscription_id = db.Column(db.String(100), nullable=True)
    stripe_price_id = db.Column(db.String(100), nullable=True)
    
    # Subscription details
    plan_name = db.Column(db.String(50), nullable=False, default='trial')  # trial, starter, professional, enterprise
    billing_cycle = db.Column(db.String(20), nullable=False, default='monthly')  # monthly, yearly
    status = db.Column(db.String(20), default='trial')  # trial, active, past_due, cancelled, unpaid
    
    # Usage limits
    max_projects = db.Column(db.Integer, default=3)  # Limited for trial
    max_users = db.Column(db.Integer, default=1)
    projects_used_this_month = db.Column(db.Integer, default=0)
    
    # Trial management
    trial_start = db.Column(db.DateTime, default=datetime.utcnow)
    trial_end = db.Column(db.DateTime, default=lambda: datetime.utcnow() + timedelta(days=7))  # 7-day trial
    trial_reminder_sent = db.Column(db.Boolean, default=False)  # 2 days before expiry
    trial_ending_reminder_sent = db.Column(db.Boolean, default=False)  # Day before expiry
    
    # Subscription dates
    current_period_start = db.Column(db.DateTime, nullable=True)
    current_period_end = db.Column(db.DateTime, nullable=True)
    
    # Cancellation and expiry management
    cancelled_at = db.Column(db.DateTime, nullable=True)
    cancellation_reason = db.Column(db.String(100), nullable=True)
    will_cancel_at_period_end = db.Column(db.Boolean, default=False)
    cancellation_requested_at = db.Column(db.DateTime, nullable=True)
    
    # Payment failure tracking
    failed_payment_count = db.Column(db.Integer, default=0)
    last_payment_failure = db.Column(db.DateTime, nullable=True)
    past_due_notified = db.Column(db.Boolean, default=False)
    
    # Expiration reminders
    expiration_reminder_sent = db.Column(db.Boolean, default=False)  # 7 days before expiry
    final_expiration_reminder_sent = db.Column(db.Boolean, default=False)  # 1 day before expiry
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = db.relationship('Company', back_populates='subscription')
    
    @property
    def is_active(self):
        """Check if subscription allows system access"""
        now = datetime.utcnow()
        
        if self.status == 'trial':
            return now <= self.trial_end
        elif self.status == 'active':
            if self.will_cancel_at_period_end:
                # Allow access until period ends even if cancellation is scheduled
                return self.current_period_end and now <= self.current_period_end
            return True
        elif self.status == 'past_due':
            # Give 3 days grace period for past due subscriptions
            if self.current_period_end:
                grace_period_end = self.current_period_end + timedelta(days=3)
                return now <= grace_period_end
            return False
        
        return False
    
    @property
    def days_remaining(self):
        """Get days remaining in current period"""
        now = datetime.utcnow()
        
        if self.status == 'trial':
            delta = self.trial_end - now
            return max(0, delta.days)
        elif self.status == 'active' and self.current_period_end:
            delta = self.current_period_end - now
            return max(0, delta.days)
        elif self.status == 'past_due' and self.current_period_end:
            # Show negative days for past due
            delta = self.current_period_end - now
            return delta.days  # Can be negative
        
        return 0
    
    @property
    def is_expired(self):
        """Check if subscription has expired"""
        now = datetime.utcnow()
        
        if self.status == 'trial':
            return now > self.trial_end
        elif self.status == 'active' and self.current_period_end:
            return now > self.current_period_end
        elif self.status in ['cancelled', 'unpaid']:
            return True
        
        return False
    
    def is_trial_ending_soon(self, days=2):
        """Check if trial is ending within specified days"""
        if self.status != 'trial':
            return False
        
        now = datetime.utcnow()
        warning_date = self.trial_end - timedelta(days=days)
        return now >= warning_date and not self.is_expired
    
    def is_subscription_expiring_soon(self, days=7):
        """Check if paid subscription is expiring within specified days"""
        if self.status != 'active' or not self.current_period_end:
            return False
        
        now = datetime.utcnow()
        warning_date = self.current_period_end - timedelta(days=days)
        return now >= warning_date and not self.is_expired
    
    def can_use_system(self):
        """Check if user can perform actions in the system"""
        return self.is_active and not self.is_expired
    
    def can_create_project(self):
        """Check if user can create new projects"""
        if not self.can_use_system():
            return False
        
        if self.max_projects == -1:  # Unlimited
            return True
        
        return self.projects_used_this_month < self.max_projects
    
    def can_add_user(self, current_user_count):
        """Check if more users can be added"""
        if not self.can_use_system():
            return False
        
        if self.max_users == -1:  # Unlimited
            return True
        
        return current_user_count < self.max_users
    
    def increment_project_usage(self):
        """Increment project usage for current period"""
        if self.can_create_project():
            self.projects_used_this_month += 1
            return True
        return False
    
    def reset_monthly_usage(self):
        """Reset monthly usage counters (called on renewal)"""
        self.projects_used_this_month = 0
        self.expiration_reminder_sent = False
        self.final_expiration_reminder_sent = False
        self.past_due_notified = False
    
    def get_upgrade_recommendation(self):
        """Get recommended upgrade plan based on usage"""
        if self.status == 'trial':
            if self.projects_used_this_month >= 2:
                return 'starter'
            return 'starter'
        
        if self.plan_name == 'starter':
            if self.projects_used_this_month >= 4:
                return 'professional'
        elif self.plan_name == 'professional':
            if self.projects_used_this_month >= 20:
                return 'enterprise'
        
        return None
    
    def to_dict(self):
        return {
            'id': self.id,
            'plan_name': self.plan_name,
            'billing_cycle': self.billing_cycle,
            'status': self.status,
            'is_active': self.is_active,
            'is_expired': self.is_expired,
            'can_use_system': self.can_use_system(),
            'max_projects': self.max_projects,
            'max_users': self.max_users,
            'projects_used_this_month': self.projects_used_this_month,
            'days_remaining': self.days_remaining,
            'trial_end': self.trial_end.isoformat() if self.trial_end else None,
            'current_period_end': self.current_period_end.isoformat() if self.current_period_end else None,
            'will_cancel_at_period_end': self.will_cancel_at_period_end,
            'is_trial': self.status == 'trial',
            'is_trial_ending_soon': self.is_trial_ending_soon(),
            'is_subscription_expiring_soon': self.is_subscription_expiring_soon(),
            'upgrade_recommendation': self.get_upgrade_recommendation(),
            'usage_percentage': (self.projects_used_this_month / max(self.max_projects, 1)) * 100 if self.max_projects > 0 else 0
        }