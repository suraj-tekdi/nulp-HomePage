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
          // Only About page contact-us entries
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

  // Find the primary object which contains address, phone, email, map (any one that has any of these)
  const primary = useMemo(() => {
    return items.find(
      (i) => (i.address || i.phone || i.email || i.map_address || "").length > 0
    );
  }, [items]);

  const title = useMemo(() => {
    // If any item exists we show "Contact Us"
    return items.length > 0 ? "Contact Us" : "";
  }, [items]);

  const addressHtml = useMemo(() => primary?.address || "", [primary]);
  const phoneHtml = useMemo(() => primary?.phone || "", [primary]);
  const emailHtml = useMemo(() => primary?.email || "", [primary]);
  const mapHtml = useMemo(
    () => (primary?.map_address ? decodeHtmlEntities(primary.map_address) : ""),
    [primary]
  );

  if (loading) return null;
  if (!Array.isArray(items) || items.length === 0) return null;

  return (
    <section id="contact-us" className={`${styles.contact} ${className}`}>
      <div className={styles.contact__container}>
        {title ? <h2 className={styles.contact__title}>{title}</h2> : null}

        <div className={styles.contact__infoGrid}>
          {addressHtml && (
            <div className={styles.contact__infoItem}>
              <span className={styles.contact__icon} aria-hidden="true">
                <LocationOnRoundedIcon
                  className={styles.contact__iconImg}
                  fontSize="medium"
                />
              </span>
              <div>
                <h3 className={styles.contact__infoTitle}>Address</h3>
                <div
                  className={styles.contact__infoText}
                  dangerouslySetInnerHTML={{ __html: addressHtml }}
                />
              </div>
            </div>
          )}

          {phoneHtml && (
            <div className={styles.contact__infoItem}>
              <span className={styles.contact__icon} aria-hidden="true">
                {/* Use the same phone icon per requirement */}
                <CallRoundedIcon
                  className={styles.contact__iconImg}
                  fontSize="medium"
                />
              </span>
              <div>
                <h3 className={styles.contact__infoTitle}>Phone</h3>
                <div
                  className={styles.contact__infoText}
                  dangerouslySetInnerHTML={{ __html: phoneHtml }}
                />
              </div>
            </div>
          )}

          {emailHtml && (
            <div className={styles.contact__infoItem}>
              <span className={styles.contact__icon} aria-hidden="true">
                {/* Same phone icon requested for email as well */}
                <CallRoundedIcon
                  className={styles.contact__iconImg}
                  fontSize="medium"
                />
              </span>
              <div>
                <h3 className={styles.contact__infoTitle}>Email</h3>
                <div
                  className={styles.contact__infoText}
                  dangerouslySetInnerHTML={{ __html: emailHtml }}
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
