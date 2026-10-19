import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'.',testMatch:/premium\.spec\.mjs$/,timeout:30000,workers:2,reporter:'list',
 use:{locale:'fr-FR',timezoneId:'Europe/Paris',viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true}});
