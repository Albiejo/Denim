
const form = document.getElementById('form');
const username = document.getElementById('name');
const email = document.getElementById('email');
const password = document.getElementById('password');
const confirmPassword = document.getElementById('confirmPassword');




const setError = (element, message) => {
    const inputControl = element.parentElement;
    const errorDisplay = inputControl.querySelector('.error');

    errorDisplay.innerText = message;
    inputControl.classList.add('error');
    inputControl.classList.remove('success')
}

const setSuccess = element => {
    const inputControl = element.parentElement;
    const errorDisplay = inputControl.querySelector('.error');

    errorDisplay.innerText = '';
    inputControl.classList.remove('error');
    inputControl.classList.add('success');

};



const isValidEmail = email => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}

function validateInputs() {
    let count = 0;
    const usernameValue = username.value.trim();
    const emailValue = email.value.trim();
    const passwordValue = password.value.trim();
    const confirmPassword = confirmPassword.value.trim();

    const specialChars = /[`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;

    if (usernameValue ==='') {
        setError(username, 'Name is required');
    } else if (/\d/.test(usernameValue)) {
        setError(username, 'Name cannot contain numbers!');
    } else if (specialChars.test(usernameValue)) {
        setError(username, 'Name cannot contain spectial characters!');
    } else {
        count++;
        setSuccess(username);

    }




    if (emailValue === '') {
        setError(email, 'Email is required');
    } else if (!isValidEmail(emailValue)) {
        setError(email, 'Provide a valid email address');
    } else {
        count++;
        setSuccess(email);

    }




    if (passwordValue ==='') {
        setError(password, 'Password is required');
    } else if (passwordValue.length < 8) {
        setError(password, 'Password must be at least 8 character.')
    } else {
        count++;
        setSuccess(password);
    }

    if (confirmPassword ==='') {
        setError(confirmPassword, 'Confirm Password is required');
    } else if (confirmPassword.length < 8) {
        setError(confirmPassword, 'Passwo Confirmrd must be same as password.')
    } else {
        count++;
        setSuccess(password);
    }


    

    if (count == 4) {
        return true
    } else {
        return false
    }

};