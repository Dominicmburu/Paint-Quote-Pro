import stripe
import os
from datetime import datetime, timedelta
from models import db
from models.subscription import Subscription

stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')

class SubscriptionService:
    
    @staticmethod
    def create_customer(email: str, name: str, company_id: int):
        """Create a Stripe customer"""
        try:
            customer = stripe.Customer.create(
                email=email,
                name=name,
                metadata={'company_id': str(company_id)}
            )
            return customer
        except Exception as e:
            raise Exception(f"Failed to create Stripe customer: {e}")
    
    @staticmethod
    def create_checkout_session(customer_id: str, price_id: str, success_url: str, cancel_url: str, metadata: dict):
        """Create a Stripe checkout session"""
        try:
            session = stripe.checkout.Session.create(
                customer=customer_id,
                payment_method_types=['card'],
                line_items=[{
                    'price': price_id,
                    'quantity': 1,
                }],
                mode='subscription',
                success_url=success_url,
                cancel_url=cancel_url,
                metadata=metadata
            )
            return session
        except Exception as e:
            raise Exception(f"Failed to create checkout session: {e}")
    
    @staticmethod
    def cancel_subscription(stripe_subscription_id: str):
        """Cancel a Stripe subscription"""
        try:
            subscription = stripe.Subscription.delete(stripe_subscription_id)
            return subscription
        except Exception as e:
            raise Exception(f"Failed to cancel subscription: {e}")
    
    @staticmethod
    def get_subscription(stripe_subscription_id: str):
        """Get subscription details from Stripe"""
        try:
            subscription = stripe.Subscription.retrieve(stripe_subscription_id)
            return subscription
        except Exception as e:
            raise Exception(f"Failed to get subscription: {e}")