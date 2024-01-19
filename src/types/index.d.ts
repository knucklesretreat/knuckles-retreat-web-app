export { };

declare global {
    interface Window {
        grecaptcha: any;
        onRecaptchaLoad: any;
        screen: any;
    }
}
