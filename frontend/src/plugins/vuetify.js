import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const customTheme = {
  dark: true,
  colors: {
    background: '#313338',
    surface: '#313338',
    primary: '#5865F2',
    'primary-darken-1': '#4752C4',
    secondary: '#B5BAC1',
    'secondary-darken-1': '#ffffff',
    accent: '#5865F2',
    error: '#ED4245',
    info: '#949BA4',
    success: '#57F287',
    warning: '#FEE75C',
    sidebar: '#2B2D31',
    header: '#313338',
    channelHover: '#404249',
    textMuted: '#949BA4',
    divider: '#3F4147',
    messageHover: '#2E3035'
  }
}

export const vuetify = createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: 'customTheme',
    themes: {
      customTheme
    }
  }
})