// ============================================
// Restaurant JSON-LD Structured Data
// For SEO — helps Google understand the business
// ============================================

export function getRestaurantJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: "KFM Delice",
    image: "https://kfmdelice.sn/og-image.jpg",
    url: "https://kfmdelice.sn",
    telephone: "+224 622 00 00 00",
    email: "contact@kfmdelice.sn",
    address: {
      "@type": "PostalAddress",
      streetAddress: "45 Rue Carnot, Kaloum",
      addressLocality: "Conakry",
      addressRegion: "Conakry",
      postalCode: "1000",
      addressCountry: "GN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 9.5092,
      longitude: -13.7122,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "10:00",
        closes: "23:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Saturday",
        opens: "10:00",
        closes: "00:00",
      },
    ],
    servesCuisine: ["Guinean", "African", "West African"],
    priceRange: "GNF",
    acceptsReservations: "True",
    menu: "https://kfmdelice.sn/customer/menu",
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.7",
      reviewCount: "230",
    },
  };
}

export function getOrganizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "KFM Delice",
    url: "https://kfmdelice.sn",
    logo: "https://kfmdelice.sn/logo.svg",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+224-622-00-00-00",
      contactType: "customer service",
      areaServed: "GN",
      availableLanguage: ["French", "Soussou", "Malinke", "Fulani"],
    },
    sameAs: [
      "https://facebook.com/kfmdelice",
      "https://instagram.com/kfmdelice",
    ],
  };
}
