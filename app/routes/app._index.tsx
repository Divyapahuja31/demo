import { useState } from "react";
import type { LoaderFunctionArgs, HeadersFunction } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import QRCode from "qrcode";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(
    `#graphql
      query {
        products(first: 10) {
          edges {
            node {
              id
              title
              handle
            }
          }
        }
      }
    `
  );

  const data = await response.json();

  return {
    products: data.data.products.edges,
  };
};

export default function Index() {
  const { products } = useLoaderData<typeof loader>();
  const [selectedProduct, setSelectedProduct] = useState("");
  const [qrCode, setQrCode] = useState("");

  const generateQr = async () => {
    if (!selectedProduct) return;

    const storeUrl = window.location.origin.replace("admin.", "");
    const productUrl = `${storeUrl}/products/${selectedProduct}`;

    const qr = await QRCode.toDataURL(productUrl);
    setQrCode(qr);
  };

  return (
    <s-page heading="QR Code Generator">
      <s-section>
        <select
          value={selectedProduct}
          onChange={(e) => setSelectedProduct(e.target.value)}
        >
          <option value="">Select Product</option>
          {products.map((p: any) => (
            <option key={p.node.id} value={p.node.handle}>
              {p.node.title}
            </option>
          ))}
        </select>

        <br /><br />

        <s-button onClick={generateQr}>
          Generate QR Code
        </s-button>

        {qrCode && (
          <div style={{ marginTop: "20px" }}>
            <img src={qrCode} alt="QR Code" />
          </div>
        )}
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};