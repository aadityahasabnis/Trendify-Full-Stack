import React from 'react';
import Title from '../components/Title';
import NewsletterBox from '../components/NewsletterBox';
import useScrollToTop from '../hooks/useScrollToTop';

const Shop = () => {
    useScrollToTop();

    return (
        <div className="shop">
            <Title title="Shop" />
            <div className="shop-content">
                <div className="shop-text">
                    <h2>Coming Soon</h2>
                    <p>Our shop is under construction. Check back soon for amazing products!</p>
                </div>
            </div>
            <NewsletterBox />
        </div>
    );
};

export default Shop; 