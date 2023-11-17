$(document).ready(function () {

    $('.addwnow').on('click', function () {
        let product_id = $(this).data('item-id');

        $.ajax({
            url: '/addtowishlist',
            method: 'POST',
            data: { product_id: product_id },
            success: function (response) {
                if(response.error){
                    document.getElementById('wishlistmsg').innerText="Item already present in wishlist";
                    document.getElementById('wishlistcount').innerText=response.count
                }
           
                        document.getElementById('wishlistcount').innerText=response.count
                        let modal = document.getElementById('wishlistModal');
                        modal.style.display = 'block';

                        // Close the modal when the close button is clicked
                        let closeBtn = document.getElementsByClassName('close')[0];
                        closeBtn.onclick = function () {
                        modal.style.display = 'none';
                        };
                    
                                
            },
            error: function (error) {
                console.error(error);
            }
        });
    });

    closeModal.addEventListener("click", function () {
        wishlistModal.style.display = "none";
    });

})