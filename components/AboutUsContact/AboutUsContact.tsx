import React, { useEffect, useMemo, useState } from "react";
import styles from "./AboutUsContact.module.css";
import CallRoundedIcon from "@mui/icons-material/CallRounded";
import LocationOnRoundedIcon from "@mui/icons-material/LocationOnRounded";
import { footerContactsApi, type HomepageContactItem } from "../../services";

interface AboutUsContactProps {
  className?: string;
}

const isPublished = (item: HomepageContactItem): boolean => {
  const anyItem = item as unknown as { state?: string | null };
  const st = (anyItem?.state || "").toString().toLowerCase();
  return st === "" || st === "published";
};

const decodeHtmlEntities = (html: string): string => {
  try {
    if (typeof window === "undefined") return html;
    const textarea = document.createElement("textarea");
    textarea.innerHTML = html;
    return textarea.value;
  } catch {
    return html;
  }
};

const AboutUsContact: React.FC<AboutUsContactProps> = ({ className = "" }) => {
  const [items, setItems] = useState<HomepageContactItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const res = await footerContactsApi.getHomepageContacts();
      if (mounted && res.success && Array.isArray(res.data)) {
        const filtered = (res.data as HomepageContactItem[])
          .filter((i) => (i.category?.slug || "") === "about-page-contact-us")
          .filter((i) => isPublished(i))
          .filter((i) => i.is_active !== false)
          .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
        setItems(filtered);
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const title = useMemo(() => {
    const titleItem = items.find((i) => (i.title || "").trim().length > 0);
    return titleItem ? "Contact Us" : "";
  }, [items]);

  const emailItem = useMemo(
    () =>
      items.find(
        (i) =>
          (i.slug || "").toLowerCase() === "contact-us" ||
          (i.address || "").toLowerCase().includes("mailto")
      ),
    [items]
  );

  const addressItem = useMemo(
    () =>
      items.find(
        (i) =>
          (i.slug || "").toLowerCase() === "national-institute-of-urban-affairs"
      ),
    [items]
  );

  const mapItem = useMemo(
    () =>
      items.find(
        (i) =>
          (i.slug || "").toLowerCase() === "address" ||
          (i.address || "").toLowerCase().includes("iframe")
      ),
    [items]
  );

  if (loading) return null;
  if (!Array.isArray(items) || items.length === 0) return null;

  // Prepare map HTML, decoding CMS-escaped iframe if necessary
  const mapHtml = mapItem?.address ? decodeHtmlEntities(mapItem.address) : "";

  return (
    <section id="contact-us" className={`${styles.contact} ${className}`}>
      <div className={styles.contact__container}>
        {title ? <h2 className={styles.contact__title}>{title}</h2> : null}

        <div className={styles.contact__infoGrid}>
          {addressItem && (
            <div className={styles.contact__infoItem}>
              <span className={styles.contact__icon} aria-hidden="true">
                <LocationOnRoundedIcon
                  className={styles.contact__iconImg}
                  fontSize="medium"
                />
              </span>
              <div>
                <h3 className={styles.contact__infoTitle}>
                  {addressItem.title}
                </h3>
                <div
                  className={styles.contact__infoText}
                  dangerouslySetInnerHTML={{
                    __html: addressItem.address || "",
                  }}
                />
              </div>
            </div>
          )}

          {emailItem && (
            <div className={styles.contact__infoItem}>
              <span className={styles.contact__icon} aria-hidden="true">
                <CallRoundedIcon
                  className={styles.contact__iconImg}
                  fontSize="medium"
                />
              </span>
              <div>
                <h3 className={styles.contact__infoTitle}>Email ID:</h3>
                <div
                  dangerouslySetInnerHTML={{ __html: emailItem.address || "" }}
                />
              </div>
            </div>
          )}
        </div>

        {mapHtml && (
          <div className={styles.contact__mapWrapper}>
            <div dangerouslySetInnerHTML={{ __html: mapHtml }} />
          </div>
        )}
      </div>
    </section>
  );
};

export default AboutUsContact;
