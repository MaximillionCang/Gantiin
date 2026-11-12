# Browser assets

`gantiin-logo.svg` is the owner's cyan/blue/violet Gantiin artwork supplied in `Blue Black and White Modern Website Development Presentation.svg` on 12 November 2026. Its original embedded artwork and luminance transparency mask are preserved, with the SVG viewBox cropped to remove presentation margins. The background is transparent; the white wordmark is designed for the application's dark surfaces. No AI regeneration or lettering replacement was used.

`gantiin-symbol.svg` uses the same source and transparency mask, cropped to the G symbol for the collapsed desktop sidebar. It is served only through its exact allowlisted asset path.

`gantiin-logo-light.svg` reuses the original supplied artwork and transparency mask. Native SVG clips separate the symbol and wordmark; a colour matrix makes only the wordmark black. The symbol's colour pixels and lettering shapes are unchanged, with no image generation. Use it on light surfaces; the dark default keeps the white-wordmark logo. The collapsed symbol is shared by both themes.

`login-committee.svg` is the owner's supplied `Blue Black and White Modern Website Development Presentation (1).svg`, copied unchanged. It shows people reviewing documents and charts. Committee sign-in uses this image for its photo panel and faint page background; selecting another role updates both images without rebuilding the form shell. Its existing photo, mask and colour treatment are retained without image generation.

`login-treasurer.svg` is the owner's supplied `Blue Black and White Modern Website Development Presentation (2).svg`, copied unchanged. Treasurer sign-in uses this office-meeting photo for its photo panel and faint page background. Its embedded photo, mask and colour treatment are retained without image generation.

`login-finance-hd.png` remains the recovery-page background. It is the approved 1536 x 1024 blue finance illustration reconstructed from the owner's small reference image using image generation. Reconstructed details are generated; they are not recovered information from the low-resolution source. Login photo panels are hidden on narrow screens.

`paypal-mark.svg` is the official PayPal colour mark, sourced from https://www.paypalobjects.com/paypal-ui/logos/svg/paypal-mark-color.svg and stored locally for the login control. PayPal trademarks remain their owner's property; the project does not claim ownership or endorsement.

The server serves exact allowlisted asset paths. Do not expose private images, uploads, runtime receipts or Downloads directories as static files.
