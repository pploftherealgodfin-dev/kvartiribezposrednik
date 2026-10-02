import i18n from './index';
import legal from './local/bg/legal';
// This module is imported by legal/contact/report routes, outside the entry bundle.
i18n.addResourceBundle('bg', 'translation', legal, true, true);
