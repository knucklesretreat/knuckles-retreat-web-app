import { component$ } from "@builder.io/qwik";
import type { DocumentHead } from "@builder.io/qwik-city";

export default component$(() => {
  return (
    <>
      <h1>Knuckles Retreat</h1>
    </>
  );
});

export const head: DocumentHead = {
  title: "Knuckles Retreat | Sri Lanka Resorts",
  meta: [
    {
      name: "description",
      content: "Explore serenity at Knuckles Retreat, nestled in Knuckles Mountain Range, Sri Lanka. Your escape to majestic mountains for perfect relaxation.",
    },
    {
      name: "theme-color",
      content: "#274e13"
    },
    {
      property: "og:title",
      content: "Knuckles Retreat Sri Lanka"
    },
    {
      property: "og:description",
      content: "Knuckles Retreat Sri Lanka offers the perfect escape for a calm, cool and utterly relaxing getaway"
    },
    {
      property: "og:image",
      content: "https://firebasestorage.googleapis.com/v0/b/knuckles-retreat.appspot.com/o/kr-pic.png?alt=media&token=6a2d1e8b-cce8-49ff-80a6-b9276854c03e"
    },
    {
      property: "og:type",
      content: "website"
    },
    {
      property: "og:site_name",
      content: "Knuckles Retreat"
    },
    {
      property: "og:url",
      content: "https://www.knucklesretreat.com/"
    }
  ]
};
