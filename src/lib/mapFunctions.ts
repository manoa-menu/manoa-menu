export const openInMaps = (address: string) => {
  const encodedAddress = encodeURIComponent(address);
  let url;

  // Detect if the user is on iOS or macOS
  const isApplePlatform = /iPhone|iPad|iPod|Macintosh/i.test(navigator.userAgent);

  if (isApplePlatform) {
    // Use Apple Maps for iOS and macOS
    url = `https://maps.apple.com/?daddr=${encodedAddress}`;
  } else {
    // Use Google Maps for others
    url = `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
  }

  // Open the appropriate map URL
  window.open(url, '_blank');
};
