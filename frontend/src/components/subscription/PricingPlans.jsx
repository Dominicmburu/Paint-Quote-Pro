import React from 'react';

const PricingPlans = () => {
    return (
        <div className="pricing-plans">
            <h2>Our Pricing Plans</h2>
            <div className="plans-container">
                {/* Example Plan */}
                <div className="plan">
                    <h3>Basic</h3>
                    <p className="price">$9.99/month</p>
                    <ul>
                        <li>Feature 1</li>
                        <li>Feature 2</li>
                        <li>Feature 3</li>
                    </ul>
                    <button>Select Plan</button>
                </div>
                {/* Add more plans as needed */}
            </div>
        </div>
    );
};

export default PricingPlans;