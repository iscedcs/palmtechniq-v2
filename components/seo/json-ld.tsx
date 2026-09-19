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
 * `dangerouslySetInnerHTML` writes the bytes verbatim, which is the only way
 * to emit this correctly from a Server Component.
 *
 * WHY THAT IS SAFE HERE
 *
 * Some of this data is user-authored — tutors write course titles and bios,
 * and those reach `data` — so the guarantee has to be real, not assumed:
 *
 *   1. `JSON.stringify` is the only writer. Its output is always well-formed
 *      JSON, never raw markup, and it escapes every quote and backslash in
 *      the values it serialises.
 *   2. Every `<` is rewritten to its JSON unicode escape, so the two
 *      sequences that end a script element early — a closing script tag and
 *      an HTML comment opener — cannot appear literally in the output,
 *      whatever a tutor types. A JSON parser reads the escape as the same
 *      character, so the structured data itself is unchanged.
 *
 * With no way to leave the element, the content is inert: the browser parses
 * it as JSON, never as script. A sanitiser like DOMPurify would be the wrong
 * tool — it strips HTML, and this payload must not contain HTML at all.
 */

type JsonLdProps = {
  data: Record<string, unknown> | Record<string, unknown>[];
};

export function JsonLd({ data }: JsonLdProps) {
  const payload = JSON.stringify(data).replace(/</g, "\\u003c");

  return (
    <script
      type="application/ld+json"
      // nosemgrep: typescript.react.security.audit.react-dangerouslysetinnerhtml.react-dangerouslysetinnerhtml
      dangerouslySetInnerHTML={{ __html: payload }}
    />
  );
}
