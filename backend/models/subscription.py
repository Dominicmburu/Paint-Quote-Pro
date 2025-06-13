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
    plan_name = db.Column(db.String(50), nullable=False)  # starter, professional, enterprise
    billing_cycle = db.Column(db.String(20), nullable=False)  # monthly, yearly
    status = db.Column(db.String(20), default='trial')  # trial, active, past_due, cancelled, unpaid
    
    # Usage limits
    max_projects = db.Column(db.Integer, default=50)
    max_users = db.Column(db.Integer, default=2)
    projects_used_this_month = db.Column(db.Integer, default=0)
    
    # Dates
    trial_start = db.Column(db.DateTime, default=datetime.utcnow)
    trial_end = db.Column(db.DateTime, default=lambda: datetime.utcnow() + timedelta(days=14))
    current_period_start = db.Column(db.DateTime, nullable=True)
    current_period_end = db.Column(db.DateTime, nullable=True)
    cancelled_at = db.Column(db.DateTime, nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    company = db.relationship('Company', back_populates='subscription')
    
    @property
    def is_active(self):
        if self.status == 'trial':
            return datetime.utcnow() <= self.trial_end
        return self.status == 'active'
    
    @property
    def days_remaining(self):
        if self.status == 'trial':
            delta = self.trial_end - datetime.utcnow()
            return max(0, delta.days)
        elif self.current_period_end:
            delta = self.current_period_end - datetime.utcnow()
            return max(0, delta.days)
        return 0
    
    def can_create_project(self):
        if not self.is_active:
            return False
        if self.max_projects == -1:  # Unlimited
            return True
        return self.projects_used_this_month < self.max_projects
    
    def to_dict(self):
        return {
            'id': self.id,
            'plan_name': self.plan_name,
            'billing_cycle': self.billing_cycle,
            'status': self.status,
            'is_active': self.is_active,
            'max_projects': self.max_projects,
            'max_users': self.max_users,
            'projects_used_this_month': self.projects_used_this_month,
            'days_remaining': self.days_remaining,
            'trial_end': self.trial_end.isoformat() if self.trial_end else None,
            'current_period_end': self.current_period_end.isoformat() if self.current_period_end else None
        }