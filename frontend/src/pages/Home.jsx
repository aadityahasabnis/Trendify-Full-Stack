import React from "react";
import Hero from "../components/Hero";
import LatestCollection from "../components/LatestCollection";
import BestSeller from "../components/BestSeller";
import OurPolicy from "../components/OurPolicy";
import NewsletterBox from "../components/NewsletterBox";
import PersonalizedRecommendations from "../components/PersonalizedRecommendations";
import SecondaryNav from "../components/SecondaryNav";
import { assets } from "../assets/frontend_assets/assets";

const Home = () => {
    return (
        <div>
            {/* Ensure assets.secondaryNavItems exists before passing */}
            <SecondaryNav items={assets.secondaryNavItems} />
            <Hero />
            <LatestCollection />
            <BestSeller />
            <PersonalizedRecommendations />
            <OurPolicy />
            <NewsletterBox />
        </div>
    );
};

export default Home;
