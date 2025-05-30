
import { $, component$, useStore, useVisibleTask$ } from "@builder.io/qwik";
import { DocumentHead } from "@builder.io/qwik-city";
import styles from "./inquiry.module.css";
import countrylist from "~/data/country-list.json";

export const head: DocumentHead = {
  title: "Knuckles Retreat | Inquire",
  meta: [
    {
      name: "description",
      content: "Have a question about our accommodations, services, or special requests? We're here to help. Fill out the form below with your details and inquiries, and our dedicated team will get back to you with the information you need.",
    },
    {
      name: "theme-color",
      content: "#274e13"
    },
    {
      property: "og:title",
      content: "Knuckles Retreat Sri Lanka"
    },
    {
      property: "og:description",
      content: "Knuckles Retreat Sri Lanka offers the perfect escape for a calm, cool and utterly relaxing getaway"
    },
    {
      property: "og:image",
      content: "https://firebasestorage.googleapis.com/v0/b/knuckles-retreat.appspot.com/o/kr-pic.png?alt=media&token=6a2d1e8b-cce8-49ff-80a6-b9276854c03e"
    },
    {
      property: "og:type",
      content: "website"
    },
    {
      property: "og:site_name",
      content: "Knuckles Retreat"
    },
    {
      property: "og:url",
      content: "https://www.knucklesretreat.com/"
    }
  ]
};

export default component$(() => {

    const salutations = ['Mr.', 'Mrs.', 'Miss.', 'Dr.', 'Prof.', 'Ven.'];
    const formState = useStore({
        showError: false,
        errorTxt: "",
        showLoader: false
    });

    const formData = useStore({
        salutation: "Mr.",
        fullName: "",
        country: "",
        telephone: "",
        email: "",
        arrival: "",
        departure: "",
        guestCount: "1",
        otherInfo: ""
    });

    const toastState = useStore({
        showToast: false,
        toastText: "",
        type: ""
    });

    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(() => {
        if (typeof window !== "undefined") {
            const recaptchaResElement = document.getElementById('g-recaptcha-response');
            const departureDateInput = document.getElementById('departure');

            const nextDay = new Date();
            nextDay.setDate(nextDay.getDate() + 1);

            const minDepartureDate = nextDay.toISOString().split('T')[0];
            (departureDateInput as HTMLInputElement).setAttribute('min', minDepartureDate);

            if (recaptchaResElement && recaptchaResElement.classList.contains('g-recaptcha-response')) {
                return;
            }

            window.grecaptcha.render('kr-g-recaptcha', { 'sitekey': '6LfqVD4pAAAAAByXb5ErD4k81KielZ8Ybz4PRw8K' });
        }
    });

    const validateForm = $(async () => {
        // Check if fullName is empty
        if (formData.fullName.trim() === '') {
            return 'Please enter your full name.';
        }

        // Check if country is empty
        if (formData.country.trim() === '') {
            return 'Please select your country.';
        }

        // Check if telephone is empty
        if (formData.telephone.trim() === '') {
            return 'Please enter a telephone number.';
        }

        // Check if arrival date is empty
        if (formData.arrival.trim() === '') {
            return 'Please select an arrival date.';
        }

        // Check if departure date is empty
        if (formData.departure.trim() === '') {
            return 'Please select a departure date.';
        }

        // Check if guestCount is empty
        if (formData.guestCount.trim() === '') {
            return 'Please enter the number of guests.';
        }

        // Check if email is empty
        if (formData.email.trim() === '') {
            return 'Please enter an email address.';
        }

        // Check if email format is incorrect
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            return 'Invalid email format.';
        }

        // Check if reCAPTCHA is confirmed
        const captchaRes = await window.grecaptcha.getResponse();
        if (!(captchaRes.length > 10)) {
            return "reCAPTCHA not confirmed. Please verify that you are not a robot."
        }

        // All checks passed
        return 'valid';
    });

    const setMinDepartureDate = $(() => {
        const arrivalDateInput = document.getElementById('arrival');
        const arrivalDateValue = (arrivalDateInput as HTMLInputElement).value;

        const nextDay = new Date(arrivalDateValue);
        nextDay.setDate(nextDay.getDate() + 1);
        const minDepartureDate = nextDay.toISOString().split('T')[0];
        const departureDateInput = document.getElementById('departure');
        (departureDateInput as HTMLInputElement).setAttribute('min', minDepartureDate);

        const currentDepartureDateValue = new Date((departureDateInput as HTMLInputElement).value);

        // If arrival date is greater than current departure date, update departure date
        if (new Date(arrivalDateValue) > currentDepartureDateValue) {
            const nextDay = new Date(arrivalDateValue);
            nextDay.setDate(nextDay.getDate() + 1);
            const newDepartureDate = nextDay.toISOString().split('T')[0];
            (departureDateInput as HTMLInputElement).value = newDepartureDate;
        }
    });

    const resetFrom = $(() => {
        formData.salutation = "Mr.";
        formData.fullName = "";
        formData.country = "";
        formData.telephone = "";
        formData.email = "";
        formData.arrival = "";
        formData.departure = "";
        formData.guestCount = "1";
        formData.otherInfo = "";

        if (typeof window !== "undefined") {
            window.grecaptcha.reset();
        }
    });

    const handleSubmit = $(async () => {

        const validityStr = await validateForm();
        if (validityStr !== "valid") {
            formState.showError = true;
            formState.errorTxt = validityStr;
            return;
        }

        formState.showError = false;
        formState.errorTxt = "";
        formState.showLoader = true;

        // const baseUrl = "http://127.0.0.1:5001/knuckles-retreat/us-central1/";
        const reqOptions = {
            method: "POST",
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        }

        await fetch(`${import.meta.env.PUBLIC_API_URL}/reservation`, reqOptions)
            .then(res => res.json())
            .then(data => {
                // console.log("res data: ", data);
                formState.showLoader = false;
                if (data.status === 'success') {
                    toastState.toastText = data.message;
                    toastState.type = 'success';
                } else {
                    toastState.toastText = 'Something went wrong. Please try again.';
                    toastState.type = 'error';
                }
                toastState.showToast = true;
                resetFrom();
            })
            .catch(err => {
                console.log("error: ", err);
                formState.showLoader = false;
                toastState.toastText = 'Something went wrong. Please try again.';
                toastState.type = 'error';
                toastState.showToast = true;
                resetFrom();
            })
    });

    const onToastClick = $(() => {
        if (toastState.showToast) {
            toastState.showToast = false;
        }
    });


    return (
        <section class={styles.inquiry_sec}>
            {formState.showLoader ? <div class="loading-overlay"></div> : ''}
            {toastState.showToast ? <div class={["toast", (toastState.type === 'error' ? "toast-error" : null)]} onClick$={onToastClick}>
                <span>{toastState.toastText}</span>
            </div> : null}
            <div class={styles.inquiry_content}>
                <div class={styles.header_content}>
                    <h1>Inquire with Knuckles Retreat</h1>
                    <p>Have a question about our accommodations, services, or special requests? We're here to help. Fill out the form below with your details and inquiries,
                        and our dedicated team will get back to you with the information you need.</p>
                </div>
                <div class={styles.form_sec}>
                    <h2>Reservation Request Form</h2>

                    <form preventdefault:submit>

                        <div class={styles.form_row}>
                            <div class={styles.salutation}>
                                <label for="salutation">Salutation <span>*</span></label>
                                <select id="salutation" name="salutation" value={formData.salutation} onInput$={(e) => formData.salutation = (e.target as HTMLSelectElement).value}>
                                    {salutations.map(sal => <option key={sal} value={sal}>{sal}</option>)}
                                </select>
                            </div>

                            <div class={styles.fname}>
                                <label for="fname">Full Name <span>*</span></label>
                                <input type="text" id="fname" name="fullname" placeholder="Full Name" value={formData.fullName} onInput$={(e) => formData.fullName = (e.target as HTMLInputElement).value}></input>
                            </div>
                        </div>

                        <div class={styles.form_row}>
                            <div class={styles.country}>
                                <label for="country">Country <span>*</span></label>
                                <select id="country" name="country" value={formData.country} onInput$={(e) => formData.country = (e.target as HTMLSelectElement).value}>
                                    <option>Please select</option>
                                    {countrylist.map(cntry => <option key={cntry.code} value={cntry.name}>{cntry.name}</option>)}
                                </select>
                            </div>

                            <div class={styles.telephone}>
                                <label for="telephone">Telephone <span>*</span></label>
                                <input type="text" id="telephone" name="telephone" placeholder="Telephone" value={formData.telephone} onInput$={(e) => formData.telephone = (e.target as HTMLInputElement).value}></input>
                            </div>
                        </div>

                        <div class={styles.form_row}>
                            <div class={styles.arrival}>
                                <label for="arrival">Arrival <span>*</span></label>
                                <input type="date" id="arrival" name="arrival" placeholder="Select date" min={new Date().toISOString().split("T")[0]} value={formData.arrival} onChange$={setMinDepartureDate} onInput$={(e) => formData.arrival = (e.target as HTMLInputElement).value}></input>
                            </div>

                            <div class={styles.departure}>
                                <label for="departure">Departure <span>*</span></label>
                                <input type="date" id="departure" name="departure" placeholder="Select date" value={formData.departure} onInput$={(e) => formData.departure = (e.target as HTMLInputElement).value}></input>
                            </div>
                        </div>

                        <div class={styles.form_row}>
                            <div class={styles.email}>
                                <label for="email">Email <span>*</span></label>
                                <input type="text" id="email" name="email" placeholder="Email" value={formData.email} onInput$={(e) => formData.email = (e.target as HTMLInputElement).value}></input>
                            </div>
                            <div class={styles.guests}>
                                <label for="guestcount">Number of Guests <span>*</span></label>
                                <input type="number" min={1} max={30} id="guestcount" name="guestcount" placeholder="1" value={formData.guestCount} onInput$={(e) => formData.guestCount = (e.target as HTMLInputElement).value}></input>
                            </div>
                        </div>

                        <div class={styles.form_row}>
                            <div class={styles.otherinfo}>
                                <label for="otherinfo">Other Information</label>
                                <textarea name="otherinfo" id="otherinfo" value={formData.otherInfo} onInput$={(e) => formData.otherInfo = (e.target as HTMLTextAreaElement).value}></textarea>
                            </div>
                        </div>

                        <div class="g-recaptcha" id="kr-g-recaptcha" data-sitekey="6LfqVD4pAAAAAByXb5ErD4k81KielZ8Ybz4PRw8K"></div>
                        <br />
                        {formState.showError
                            ? <div class={styles.error_txt}>* {formState.errorTxt}</div>
                            : ""
                        }

                        <div class={styles.btn_row}>
                            <button class={styles.submit_btn} onClick$={handleSubmit} type="submit">Submit</button>
                            <span onClick$={() => resetFrom()}>RESET</span>
                        </div>

                    </form>
                </div>
            </div>
        </section>
    );
});