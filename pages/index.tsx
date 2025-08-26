import React, { useState } from 'react';
import Head from 'next/head';
import { Header, Banner, LaunchVideoSection, DomainsSection, TrendingCoursesSection, TrendingGoodPracticesSection, TrendingDiscussionsSection, IndiaMapSection, TestimonialsSection, PartnersSection, Footer } from '../components';
import { partnersApi, HomepagePartnerItem, testimonialsApi, HomepageTestimonialItem } from '../services/api';

interface HomePageProps {
  initialPartners: HomepagePartnerItem[];
  initialTestimonials: HomepageTestimonialItem[];
}

const HomePage: React.FC<HomePageProps> = ({ initialPartners, initialTestimonials }) => {
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
      <TestimonialsSection initialTestimonials={initialTestimonials} />

      {/* Launch Video Section */}
      <LaunchVideoSection />

      {/* Partners Section */}
      <PartnersSection className="" initialPartners={initialPartners} />

      {/* Footer */}
      <Footer />

    </>
  );
};

export default HomePage;

export async function getStaticProps() {
  const [partnersRes, testimonialsRes] = await Promise.all([
    partnersApi.getHomepagePartners(),
    testimonialsApi.getHomepageTestimonials(),
  ]);

  const partners = partnersRes.success && partnersRes.data ? partnersRes.data : [];
  const sortedPartners = [...partners].sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

  const testimonials = testimonialsRes.success && testimonialsRes.data ? testimonialsRes.data : [];
  const sortedTestimonials = [...testimonials].sort((a, b) => (a.id || 0) - (b.id || 0));

  return {
    props: {
      initialPartners: sortedPartners,
      initialTestimonials: sortedTestimonials,
    },
  };
} 