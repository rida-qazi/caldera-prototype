import { useJsApiLoader } from "@react-google-maps/api";

export const useGoogleMaps = () => {
  return useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "",
    libraries: ["places"],   // One global setting
  });
};
