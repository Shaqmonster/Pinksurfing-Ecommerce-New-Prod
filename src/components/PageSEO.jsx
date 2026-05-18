import { Helmet } from "react-helmet";

export const SITE_URL = "https://pinksurfing.com";
const DEFAULT_OG_IMAGE = `${SITE_URL}/logo.jpg`;

/**
 * Per-route SEO via react-helmet. index.html carries fallback meta for first paint.
 */
export default function PageSEO({
  title,
  description,
  path = "/",
  ogTitle,
  ogDescription,
  ogImage = DEFAULT_OG_IMAGE,
  noindex = false,
  jsonLd,
}) {
  const canonical =
    path === "/" ? `${SITE_URL}/` : `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const metaTitle = title.includes("PinkSurfing") ? title : `${title} | PinkSurfing`;
  const ogT = ogTitle || metaTitle;
  const ogD = ogDescription || description;

  return (
    <Helmet>
      <title>{metaTitle}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={canonical} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical} />
      <meta property="og:site_name" content="PinkSurfing" />
      <meta property="og:title" content={ogT} />
      {ogD && <meta property="og:description" content={ogD} />}
      <meta property="og:image" content={ogImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={ogT} />
      {ogD && <meta name="twitter:description" content={ogD} />}
      <meta name="twitter:image" content={ogImage} />

      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
}
