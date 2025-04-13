import React from "react";
import Hero from "../components/Hero";
import LatestCollection from "../components/LatestCollection";
import BestSeller from "../components/BestSeller";
import OurPolicy from "../components/OurPolicy";
import NewsletterBox from "../components/NewsletterBox";
import PersonalizedRecommendations from "../components/PersonalizedRecommendations";
import SecondaryNav from "../components/SecondaryNav";
import CategoriesGrid from "../components/CategoriesGrid";
import { assets } from "../assets/frontend_assets/assets";

const Home = () => {
    return (
        <div className="min-h-screen">
            {/* Secondary Navigation */}
            <div className="hidden md:block">

                <SecondaryNav items={assets.secondaryNavItems} />
            </div>

            {/* Hero Section with Slideshow */}
            <Hero />

            {/* Categories Grid */}
            <CategoriesGrid />

            {/* Latest Collection with Carousel */}
            <LatestCollection />

            {/* Best Sellers with Carousel */}
            <BestSeller />

            {/* Personalized Recommendations */}
            <PersonalizedRecommendations />

            {/* Our Policy Section */}
            <OurPolicy />

            {/* Newsletter Subscription */}
            <NewsletterBox />
        </div>
    );
};

export default Home;
