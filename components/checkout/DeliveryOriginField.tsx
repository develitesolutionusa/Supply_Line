"use client";

import { useEffect, useId, useRef, useState } from "react";
import { DELIVERY_METHODS, formatCents } from "@/lib/pricing";
import { fieldClass } from "@/lib/ui";
import {
  DEFAULT_COUNTRY,
  DEFAULT_COUNTRY_CODE,
  composeLocation,
  emptyRegion,
  selectionLabel,
  type PlaceSuggestion,
  type RegionContext,
} from "@/lib/places";

type Coords = { lat: number; lon: number };

type PlacesPayload = {
  places?: PlaceSuggestion[];
  location?: string;
  region?: RegionContext;
};

async function fetchPlaces(
  params: {
    q?: string;
    country?: string;
    countryCode?: string;
    state?: string;
    city?: string;
    lat?: number;
    lon?: number;
  },
  signal?: AbortSignal,
) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.country) search.set("country", params.country);
  if (params.countryCode) search.set("countryCode", params.countryCode);
  if (params.state) search.set("state", params.state);
  if (params.city) search.set("city", params.city);
  if (params.lat != null) search.set("lat", String(params.lat));
  if (params.lon != null) search.set("lon", String(params.lon));
  const response = await fetch(`/api/checkout/places?${search.toString()}`, { cache: "no-store", signal });
  if (!response.ok) return { places: [] as PlaceSuggestion[] };
  return (await response.json()) as PlacesPayload;
}

export function DeliveryOriginField({
  originLocation,
  deliveryPoint,
  delivery,
  onChange,
  onError,
}: {
  originLocation: string;
  deliveryPoint: string;
  delivery: string;
  onChange: (value: string) => void;
  onError: (message: string | null) => void;
}) {
  const method = DELIVERY_METHODS.find((item) => item.id === delivery);
  const feeLabel = method?.shipping_cents != null ? formatCents(method.shipping_cents) : "";
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [region, setRegion] = useState<RegionContext>(emptyRegion);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [places, setPlaces] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [liveSearch, setLiveSearch] = useState(false);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  useEffect(() => {
    if (!open && !liveSearch) return;
    const query = liveSearch ? originLocation.trim() : "";
    const controller = new AbortController();
    const handle = window.setTimeout(() => {
      void (async () => {
        setSearching(true);
        try {
          const payload = await fetchPlaces(
            {
              q: query.length >= 2 ? query : undefined,
              country: region.country || DEFAULT_COUNTRY,
              countryCode: region.countryCode || DEFAULT_COUNTRY_CODE,
              state: region.state,
              city: region.city,
              lat: coords?.lat,
              lon: coords?.lon,
            },
            controller.signal,
          );
          setPlaces(payload.places ?? []);
          setActiveIndex(0);
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return;
        } finally {
          if (!controller.signal.aborted) setSearching(false);
        }
      })();
    }, 350);
    return () => {
      controller.abort();
      window.clearTimeout(handle);
    };
  }, [open, originLocation, liveSearch, region.country, region.countryCode, region.state, region.city, coords]);

  function applyRegion(place: PlaceSuggestion) {
    setRegion((current) => {
      if (place.kind === "country") {
        return { ...emptyRegion(), country: place.primary, countryCode: place.code || "" };
      }
      if (place.kind === "state") {
        return { ...current, state: place.primary, stateCode: place.code || "", city: "", street: "" };
      }
      if (place.kind === "city") {
        return { ...current, city: place.primary, street: "" };
      }
      if (place.kind === "street") {
        return { ...current, street: place.primary };
      }
      return current;
    });
  }

  function selectPlace(place: PlaceSuggestion) {
    setLiveSearch(false);
    applyRegion(place);
    onChange(selectionLabel(place, region));
    setOpen(false);
  }

  async function useCurrentLocation() {
    if (!navigator.geolocation) {
      onError("Location is not available in this browser. Enter your current location manually.");
      return;
    }
    setLocating(true);
    onError(null);
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12_000,
        });
      });
      const next = { lat: position.coords.latitude, lon: position.coords.longitude };
      setCoords(next);
      setLiveSearch(false);
      const payload = await fetchPlaces(next);
      const nextRegion = payload.region ?? emptyRegion();
      setRegion(nextRegion);
      onChange(payload.location?.trim() || composeLocation(nextRegion) || `${next.lat.toFixed(5)}, ${next.lon.toFixed(5)}`);
      setPlaces(payload.places ?? []);
      setActiveIndex(0);
      setOpen((payload.places?.length ?? 0) > 0);
    } catch {
      onError("Could not read your current location. Enter it manually.");
    } finally {
      setLocating(false);
    }
  }

  return (
    <div className="space-y-3 rounded-md border border-slate-200 bg-canvas p-4">
      <div ref={rootRef} className="relative">
        <label className={fieldClass.LABEL} htmlFor="checkout-origin">
          Current location
        </label>
        <input
          id="checkout-origin"
          className={fieldClass.INPUT}
          value={originLocation}
          placeholder="Search country, state, city, or street"
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open && places.length > 0}
          aria-controls={listId}
          aria-activedescendant={open && places[activeIndex] ? `${listId}-${places[activeIndex].id}` : undefined}
          onChange={(event) => {
            setLiveSearch(true);
            onChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            if (coords || !navigator.geolocation || !navigator.permissions?.query) return;
            void navigator.permissions.query({ name: "geolocation" }).then((status) => {
              if (status.state !== "granted") return;
              navigator.geolocation.getCurrentPosition(
                (position) => {
                  setCoords({ lat: position.coords.latitude, lon: position.coords.longitude });
                },
                () => undefined,
                { maximumAge: 60_000, timeout: 4_000 },
              );
            });
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setOpen(false);
              return;
            }
            if (!open || places.length === 0) return;
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActiveIndex((index) => Math.min(index + 1, places.length - 1));
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setActiveIndex((index) => Math.max(index - 1, 0));
            }
            if (event.key === "Enter" && places[activeIndex]) {
              event.preventDefault();
              selectPlace(places[activeIndex]);
            }
          }}
        />
        <p className="mt-1 text-xs text-slate-500">
          One search for {region.country || DEFAULT_COUNTRY}: states, cities, and streets appear together.
        </p>
        {open && places.length > 0 ? (
          <ul
            id={listId}
            className="absolute z-20 mt-1 max-h-72 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 shadow-lg"
            role="listbox"
            aria-label="Locations"
          >
            {places.map((place, index) => (
              <li key={`${place.kind ?? "place"}:${place.id}`}>
                <button
                  type="button"
                  id={`${listId}-${place.id}`}
                  role="option"
                  aria-selected={index === activeIndex}
                  className={`flex w-full flex-col px-3 py-2 text-left ${
                    index === activeIndex ? "bg-slate-50" : "bg-white"
                  } hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-inset`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectPlace(place)}
                >
                  <span className="text-sm font-medium text-navy">{place.primary}</span>
                  {place.secondary ? <span className="text-xs text-slate-500">{place.secondary}</span> : null}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {open && liveSearch && originLocation.trim().length >= 2 && !searching && places.length === 0 ? (
          <p className="mt-1 text-xs text-slate-500">No matching country, state, city, or street.</p>
        ) : null}
      </div>
      <button type="button" className={fieldClass.GHOST} disabled={locating} onClick={() => void useCurrentLocation()}>
        {locating ? "Finding locations near you…" : "Use my current location"}
      </button>
      {originLocation.trim() && deliveryPoint ? (
        <p className="text-sm text-slate-700">
          {method?.label ?? "Delivery"} {feeLabel} from{" "}
          <span className="font-medium text-navy">{originLocation.trim()}</span> to{" "}
          <span className="font-medium text-navy">{deliveryPoint}</span>.
        </p>
      ) : (
        <p className="text-sm text-slate-600">
          {method?.label ?? "Delivery"} is {feeLabel} from your current location to the delivery address.
        </p>
      )}
    </div>
  );
}
