import React, { useState } from 'react';
import Head from 'next/head';
import { Header, Banner, LaunchVideoSection, DomainsSection, TrendingCoursesSection, TrendingGoodPracticesSection, TrendingDiscussionsSection, IndiaMapSection, TestimonialsSection, PartnersSection, Footer } from '../components';

const HomePage: React.FC = () => {
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);

  return (
    <>
      <Head>
        <title>NULP - National Urban Learning Platform</title>
        <meta name="description" content="Learn from well-curated courses and content. Explore domain experts from other cities and develop skills." />
      </Head>

      {/* Header */}
      <Header />

      {/* Banner Section */}
      <Banner />

      {/* Domains Section */}
      <div id="domains-section">
        <DomainsSection onDomainSelect={setSelectedDomain} selectedDomain={selectedDomain} />
      </div>

      {/* Trending Courses Section */}
      <TrendingCoursesSection selectedDomain={selectedDomain} />

      {/* Trending Good Practices Section */}
      <TrendingGoodPracticesSection selectedDomain={selectedDomain} />

      {/* Trending Discussions Section */}
      <TrendingDiscussionsSection selectedDomain={selectedDomain} />

      {/* India Map Section */}
      <IndiaMapSection />

      {/* Testimonials Section */}
      <TestimonialsSection />

      {/* Launch Video Section */}
      <LaunchVideoSection />

      {/* Partners Section */}
      <PartnersSection />

      {/* Footer */}
      <Footer />

    </>
  );
};

export default HomePage; 