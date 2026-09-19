/**
 * Renders a JSON-LD block.
 *
 * WHY NOT `<script>{JSON.stringify(data)}</script>`
 *
 * That form passes the payload as a React text child, so React HTML-escapes
 * it. A course titled "Networking & Security" reached the page as
 * `Networking &amp; Security`, because a script element's content is raw text
 * and the browser never decodes entities inside it. The markup stays valid, so
 * nothing errors — it just quietly publishes the wrong title to Google.
 *
 * `dangerouslySetInnerHTML` writes the bytes verbatim. The only sequence that
 * matters is `</script`, which would close the tag early; escaping the `<`
 * keeps the JSON equivalent while making the breakout impossible.
 */

type JsonLdProps = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

export function JsonLd({ data }: JsonLdProps) {
  const payload = JSON.stringify(data).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: payload }}
    />
  );
}
