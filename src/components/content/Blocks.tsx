import type { Block } from "@/seo/blocks";

export function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((block, index) => {
        switch (block.type) {
          case "h2":
            return (
              <h2 key={index} className="text-2xl font-bold mt-12 mb-4 text-foreground">
                {block.text}
              </h2>
            );
          case "h3":
            return (
              <h3 key={index} className="text-xl font-bold mt-10 mb-4 text-foreground">
                {block.text}
              </h3>
            );
          case "p":
            return (
              <p key={index} className="mt-6 text-muted-foreground leading-relaxed">
                {block.text}
              </p>
            );
          case "ul":
            return (
              <ul key={index} className="list-disc pl-6 space-y-3 mt-4 text-muted-foreground">
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            );
          case "quote":
            return (
              <blockquote
                key={index}
                className="border-l-4 border-primary pl-6 my-10 text-xl font-medium text-foreground/80"
              >
                {block.text}
              </blockquote>
            );
          default:
            return null;
        }
      })}
    </>
  );
}
