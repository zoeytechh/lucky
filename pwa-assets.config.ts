import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// The library's default padding/background for maskable + apple-touch
// icons is 30% padding against a WHITE background — fine for a source
// image with transparency, wrong for ours: icon.svg is already a
// full-bleed deep-green square with the figure comfortably inset, so the
// default would add an unwanted white halo around it. Overriding both to
// zero padding against the app's own ground color instead.
export default defineConfig({
  images: ['pwa-assets/icon.svg'],
  preset: {
    ...minimal2023Preset,
    maskable: {
      sizes: [512],
      padding: 0,
      resizeOptions: { fit: 'contain', background: '#0b3d24' },
    },
    apple: {
      sizes: [180],
      padding: 0,
      resizeOptions: { fit: 'contain', background: '#0b3d24' },
    },
  },
})
