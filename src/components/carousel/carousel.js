"use client";
import React from "react";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./carousel.css";

const images = [
    { id: 1, src: "/images/carrusel5.jpg" },
    { id: 2, src: "/images/carrusel1.jpg" },
    { id: 3, src: "/images/carrusel6.webp" },
    { id: 4, src: "/images/carrusel4.jpg" },
    { id: 5, src: "/images/carrusel3.webp" },
    { id: 6, src: "/images/carrusel2.webp" },
];

function Carousel() {
    // const navigate = useNavigate();
    const settings = {
        dots: true,
        infinite: true,
        speed: 80,
        slidesToShow: 1,
        slidesToScroll: 1,
        autoplay: true,
        autoplaySpeed: 2500,
        fade: true,  // Añadido efecto fade para transiciones más suaves
        cssEase: "linear"  // Tipo de transición
    };
    
    // const handleClick = (id) => {
    //     navigate(`/event/${id}`);
    // };
    
    return (
        <div className="carousel-wrapper">
            <div className="carousel-container">
                <Slider {...settings}>
                    {images.map((image) => (
                        <div key={image.id} style={{ cursor: "pointer" }}>
                            <img src={image.src} alt={`Evento ${image.id}`} className="carousel-image" />
                        </div>
                    ))}
                </Slider>
            </div>
        </div>
    );
}

export default Carousel;