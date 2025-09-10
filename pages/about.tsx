import React from "react";
import Head from "next/head";
import type { GetStaticProps } from "next";
import { Header, Footer } from "../components";
import AboutUsHero from "../components/AboutUsHero/AboutUsHero";
import AboutUsVision from "../components/AboutUsVision/AboutUsVision";
import AboutUsMission from "../components/AboutUsMission/AboutUsMission";
import AboutUsApproach from "../components/AboutUsApproach/AboutUsApproach";
import AboutUsOfferings from "../components/AboutUsOfferings/AboutUsOfferings";
import AboutUsWhy from "../components/AboutUsWhy/AboutUsWhy";
import AboutUsPartner from "../components/AboutUsPartner/AboutUsPartner";
import AboutUsContact from "../components/AboutUsContact/AboutUsContact";
import { articlesApi, type HomepageArticleItem } from "../services";

type AboutPageProps = {
  orderedSectionSlugs?: string[];
};

const sectionComponents: Record<string, React.FC> = {
  "our-vision": AboutUsVision,
  "our-mission": AboutUsMission,
  "our-approach": AboutUsApproach,
  "our-offerings": AboutUsOfferings,
  "why-does-nulp-exist": AboutUsWhy,
  "partner-with-us": AboutUsPartner,
};

const DEFAULT_SECTION_ORDER: string[] = [
  "our-vision",
  "our-mission",
  "our-approach",
  "our-offerings",
  "why-does-nulp-exist",
  "partner-with-us",
];

const AboutPage: React.FC<AboutPageProps> = ({
  orderedSectionSlugs = DEFAULT_SECTION_ORDER,
}) => {
  const sections =
    Array.isArray(orderedSectionSlugs) && orderedSectionSlugs.length > 0
      ? orderedSectionSlugs
      : DEFAULT_SECTION_ORDER;

  return (
    <>
      <Head>
        <title>About Us - NULP | National Urban Learning Platform</title>
        <meta
          name="description"
          content="Learn about NULP's vision, mission, and approach to urban learning and capacity building for urban practitioners."
        />
      </Head>

      {/* Header */}
      <Header />

      {/* About Us Hero Section */}
      <AboutUsHero />

      {/* Dynamically ordered sections */}
      {sections.map((slug) => {
        const Section = sectionComponents[slug];
        return Section ? <Section key={slug} /> : null;
      })}

      {/* Get in Touch Section (not part of ordering) */}
      <AboutUsContact />

      {/* Footer */}
      <Footer />
    </>
  );
};

export const getStaticProps: GetStaticProps<AboutPageProps> = async () => {
  const allowedSlugs = new Set(DEFAULT_SECTION_ORDER);
  const res = await articlesApi.getAboutUsArticles();
  let orderedSectionSlugs = DEFAULT_SECTION_ORDER;

  if (res.success && Array.isArray(res.data)) {
    const items = (res.data as HomepageArticleItem[])
      .filter((a) => allowedSlugs.has((a.slug || "").toLowerCase()))
      .map((a) => ({
        slug: (a.slug || "").toLowerCase(),
        order: a.display_order ?? 0,
      }))
      .sort((a, b) => a.order - b.order)
      .map((a) => a.slug);

    if (items.length > 0) {
      orderedSectionSlugs = items;
    }
  }

  return {
    props: { orderedSectionSlugs },
    revalidate: 300,
  };
};

export default AboutPage;
