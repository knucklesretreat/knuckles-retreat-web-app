import { component$ } from "@builder.io/qwik";

export const Schema = component$(() => {

    const schemaContent = JSON.stringify(
        {
            "@context": "http://schema.org",
            "@type": "WebSite",
            "name": "Knuckles Retreat",
            "url": "https://www.knucklesretreat.com/",
            "publisher": {
                "@type": "Hotel",
                "image": "https://firebasestorage.googleapis.com/v0/b/knuckles-retreat.appspot.com/o/kr-pic.png?alt=media&token=6a2d1e8b-cce8-49ff-80a6-b9276854c03e",
                "priceRange": "$20 - $1100",
                "name": "Knuckles Retreat",
                "@id": "https://www.knucklesretreat.com/",
                "logo": "https://firebasestorage.googleapis.com/v0/b/knuckles-retreat.appspot.com/o/kr-logo.png?alt=media&token=4af82e8f-7001-4275-be50-911c62b4f589",
                "url": "https://www.knucklesretreat.com/",
                "brand": {
                    "@type": "Brand",
                    "name": "Knuckles Retreat",
                    "url": "https://www.knucklesretreat.com/",
                    "logo": "https://firebasestorage.googleapis.com/v0/b/knuckles-retreat.appspot.com/o/kr-logo.png?alt=media&token=4af82e8f-7001-4275-be50-911c62b4f589"
                },
                "description": "Experience serenity amidst nature's embrace in the heart of Sri Lanka's Central Province. Nestled amidst lush forests, tea plantations, and majestic mountains, Knuckles Retreat offers the perfect escape for a calm, cool, and utterly relaxing getaway.",
                "sameAs": [
                    "https://web.facebook.com/profile.php?id=61554911975425",
                    "https://www.instagram.com/knucklesretreat",
                    "https://www.youtube.com/@KnucklesRetreat"
                ],
                "hasMap": "https://www.google.lk/maps/place/Knuckles+Retreat/@7.4010009,80.7823746,17z/data=!3m1!4b1!4m6!3m5!1s0x3ae35f038d4d7721:0x73186daaad420c8!8m2!3d7.4010009!4d80.7823746!16s%2Fg%2F11l5tnmkpn?entry=ttu",
                "telephone": "(+)94 77 441 0767",
                "parentOrganization": {
                    "@type": "Corporation",
                    "url": "https://www.knucklesretreat.com/",
                    "name": "Knuckles Retreat",
                    "logo": "https://firebasestorage.googleapis.com/v0/b/knuckles-retreat.appspot.com/o/kr-logo.png?alt=media&token=4af82e8f-7001-4275-be50-911c62b4f589",
                    "@id": "https://www.knucklesretreat.com/"
                },
                "contactPoint": [
                    {
                        "@type": "ContactPoint",
                        "contactType": "Reservations",
                        "telephone": " (+)94 77 441 0767",
                        "email": " inquiries@knucklesretreat.com"
                    }
                ],
                "address": {
                    "@type": "PostalAddress",
                    "streetAddress": "Knuckles Peak Road",
                    "addressLocality": "Knuckles Peak Road, Gomara",
                    "addressCountry": "Sri Lanka"
                }
            }
        }
    );
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={schemaContent} />
        </>
    );
});