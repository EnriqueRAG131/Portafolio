document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("preview-modal");
    const iframe = document.getElementById("preview-frame");
    const previewButtons = document.querySelectorAll(".btn-preview");
    const closeButton = document.querySelector(".modal-close");
    const backdrop = document.querySelector(".modal-backdrop");

    function openModal(url) {
        if (!url) return;
        iframe.src = url;
        modal.classList.add("is-visible");
        document.body.style.overflow = "hidden";
    }

    function closeModal() {
        modal.classList.remove("is-visible");
        iframe.src = "";
        document.body.style.overflow = "";
    }

    previewButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            const url = btn.dataset.url;
            openModal(url);
        });
    });

    closeButton.addEventListener("click", closeModal);
    backdrop.addEventListener("click", closeModal);

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal.classList.contains("is-visible")) {
            closeModal();
        }
    });
});
