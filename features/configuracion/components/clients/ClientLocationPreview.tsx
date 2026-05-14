import React from "react";
import { Button } from "@heroui/react";
import { MapPinIcon } from "@heroicons/react/24/outline";
import { getGoogleMapsEmbedSrc, getGoogleMapsLink } from "./location-utils";

interface ClientLocationPreviewProps {
  mapsUrl?: string;
  lat?: number;
  lng?: number;
}

export function ClientLocationPreview({ mapsUrl, lat, lng }: ClientLocationPreviewProps) {
  const embedSrc = getGoogleMapsEmbedSrc(lat, lng, mapsUrl);
  const externalLink = getGoogleMapsLink(lat, lng, mapsUrl);

  if (!embedSrc && !externalLink) {
    return (
      <div className="rounded-xl border border-dashed border-default-300 p-4 text-sm text-default-500">
        Sin ubicación registrada.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {embedSrc ? (
        <div className="overflow-hidden rounded-xl border border-default-200">
          <iframe
            title="Mapa de ubicación del cliente"
            src={embedSrc}
            className="h-64 w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      ) : null}
      {externalLink ? (
        <Button
          as="a"
          href={externalLink}
          target="_blank"
          rel="noopener noreferrer"
          size="sm"
          variant="flat"
          startContent={<MapPinIcon className="size-4" />}
        >
          Abrir en Google Maps
        </Button>
      ) : null}
    </div>
  );
}
