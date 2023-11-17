        
        //image preview in admin add products 

           function previewImages(event) {
            var input = event.target;
            var previewContainer = document.getElementById('image-preview-container');
            previewContainer.innerHTML = ''; // Clear previous previews

            // Check if any file is selected
            if (input.files && input.files.length > 0) {
            for (var i = 0; i < input.files.length; i++) {
                var reader = new FileReader();

                reader.onload = function (e) {
                    // Create a new image element for each selected file
                    var img = document.createElement('img');
                    img.src = e.target.result;

                    // Create a "Cancel" button for each image
                    var cancelButton = document.createElement('button');
                    cancelButton.innerHTML = 'Cancel';
                    cancelButton.onclick = function () {
                        // Remove the corresponding image and button when "Cancel" is clicked
                        previewContainer.removeChild(img);
                        previewContainer.removeChild(cancelButton);
                    };

                    // Append the image and "Cancel" button to the preview container
                    previewContainer.appendChild(img);
                    previewContainer.appendChild(cancelButton);
                };

                // Read the selected file as a data URL
                reader.readAsDataURL(input.files[i]);
            }
        }
        }
        
        
        
        
        
    //admin add product validation 
    
        const nameInput = document.getElementById('pname');
        const discInput = document.getElementById('disc');
        const regInput = document.getElementById('regprice');
        const offerInput = document.getElementById('offerprice')
        const sizeinput = document.getElementById('size');
        const stockinput = document.getElementById('stock');



        const nameValidationMessage = document.getElementById('pnameValidationMessage');
        const discValidationMessage = document.getElementById('discValidationMessage');
        const regvmessage = document.getElementById('regpValidationMessage');
        const opvmessage = document.getElementById('ofpValidationMessage')
        const sizemessage = document.getElementById('sizeValidationMessage')
        const stockmessage = document.getElementById('stockValidationMessage')
        const nameRegex = /^[A-Za-z\s]{2,}$/;

        nameInput.addEventListener('input', () => {
            const name = nameInput.value;
            const isValid = validateName(name);

        });


        discInput.addEventListener('input', () => {
            const disc = discInput.value;
            const isValid = validatedisc(disc);

        });



        regInput.addEventListener('input', () => {
            const reg = regInput.value;
            const isValid = validatereg(reg);

        });



        offerInput.addEventListener('input', () => {
            const ofp = offerInput.value;
            const isValid = validateofp(ofp ,regInput.value );

        });



        sizeinput.addEventListener('input', () => {
            const size = sizeinput.value;
            const isValid = validatesize(size);

        });



        stockinput.addEventListener('input', () => {
            const stock = stockinput.value;
            const isValid = validatestock(stock);

        });





        function validateName(name) {
            if (name.trim().length < 1) {
                nameValidationMessage.textContent = "Produt Name cannot be empty"
                return false
            }
            if (!nameRegex.test(name.trim())) {
                nameValidationMessage.textContent = "Enter a valid Product name"
                return false
            }
            nameValidationMessage.textContent = ""
            return true
        }



        function validatedisc(disc) {
            if (disc.trim().length < 1) {
                discValidationMessage.textContent = "discription  cannot be empty"
                return false
            }

            discValidationMessage.textContent = ""
            return true
        }


        function validatereg(reg) {
            if (reg.trim().length < 1) {
                regvmessage.textContent = "regular price cannot be empty"
                return false
            }
            if (reg < 0) {
                regvmessage.textContent = "price should not be a negative number"
                return false
            }

            regvmessage.textContent = ""
            return true
        }


        function validateofp(ofp,reg) {
            if (ofp.trim().length < 1) {
                opvmessage.textContent = "Offer price cannot be empty"
                return false
            }
            if (parseInt(ofp.trim()) > parseInt(reg.trim())) {
                opvmessage.textContent = "Offer price should be less than Regular Price"
                return false
            }
            if (ofp < 0) {
                opvmessage.textContent = "price should not be a negative number"
                return false
            }

            opvmessage.textContent = ""
            return true
        }




        function validatesize(name) {
            if (name.trim().length < 1) {
                sizemessage.textContent = "size cannot be empty"
                return false
            }
            if (name < 0) {
                sizemessage.textContent = "size should not be a negative number"
                return false
            }

            sizemessage.textContent = ""
            return true
        }


        function validatestock(stock) {
            if (stock.trim().length < 1) {
                stockmessage.textContent = "stock cannot be empty"
                return false
            }
            if (stock < 0) {
                stockmessage.textContent = "stock should not be a negative number"
                return false
            }

            stockmessage.textContent = ""
            return true
        }

    
        function checkFormValidity() {
            let nameIsValid = validateName(nameInput.value);
            let discIsValid = validatedisc(discInput.value);
            let regIsValid = validatereg(regInput.value);
            let ofpIsValid = validateofp(offerInput.value)
            let sizevalid = validatesize(sizeinput.value)
            let stockValid = validatestock(stockinput.value)
            if (nameIsValid && discIsValid && regIsValid && ofpIsValid && sizevalid && stockValid) {
                return true
            } else {
                return false
            }
        }