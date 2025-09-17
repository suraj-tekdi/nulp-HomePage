$(document).ready(function () {
  // Trigger Button Click on Enter
  $("#site-search").on("keypress", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      $("#site-search-btn").click();
    }
  });

  $("#site-search-btn").click(function () {
    // if ($("#site-search").val().trim() != '') {
    // 	location.href = "/explore-course/1?key=" + $("#site-search").val().trim();
    // }

    const searchQuery = $("#site-search").val().trim();
    if (searchQuery !== "") {
      history.pushState(
        { globalSearchQuery: searchQuery }, // State object
        "", // Title (not commonly used)
        `/webapp?query=${searchQuery}` // URL to navigate to
      );
      location.href = `/webapp?query=${searchQuery}`; // Redirect to the new page
    }
  });
  $("#site-search-1").on("keypress", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      $("#site-search-btn-1").click();
    }
  });

  $("#site-search-btn-1").click(function () {
    // if ($("#site-search-1").val().trim() != '') {
    // 	location.href = "/explore-course/1?key=" + $("#site-search-1").val().trim();
    // }
    const searchQuery = $("#site-search-1").val().trim();
    if (searchQuery !== "") {
      history.pushState(
        { globalSearchQuery: searchQuery }, // State object
        "", // Title (not commonly used)
        `/webapp?query=${searchQuery}` // URL to navigate to
      );
      location.href = `/webapp?query=${searchQuery}`; // Redirect to the new page
    }
  });
});

// national urban learning platform slide
$("#owl-demo").owlCarousel({
  navigation: false,
  loop: true,
  items: 1,
  itemsDesktop: false,
  itemsDesktopSmall: false,
  itemsTablet: false,
  itemsMobile: false,
  autoplay: true,
  autoplayHoverPause: true,
  autoplayTimeout: 12000,
  smartSpeed: 2000,
});

$("#testimonial-carousel").owlCarousel({
  loop: true,
  margin: 10,
  // nav: true,
  responsive: {
    0: {
      items: 1,
      nav: false,
      dots: true,
      loop: true,
    },
    768: {
      items: 2,
    },
    1000: {
      items: 2,
    },
  },
});

$(".slick-slide-show").slick({
  infinite: true,
  slidesToShow: 4,
  slidesToScroll: 4,
  arrows: true,
  draggable: true,
  centerMode: true,
  centerPadding: "60px",
  responsive: [
    {
      breakpoint: 1200,
      settings: {
        slidesToShow: 4,
        slidesToScroll: 4,
        infinite: true,
        dots: true,
      },
    },
    {
      breakpoint: 1024,
      settings: {
        slidesToShow: 5,
        slidesToScroll: 5,
        infinite: true,
        dots: true,
      },
    },
    {
      breakpoint: 600,
      settings: {
        slidesToShow: 2,
        slidesToScroll: 2,
      },
    },
    {
      breakpoint: 480,
      settings: {
        slidesToShow: 1,
        slidesToScroll: 1,
      },
    },
  ],
});

$(".slick-slide-show-discussion").slick({
  infinite: true,
  slidesToShow: 3,
  slidesToScroll: 3,
  draggable: true,
  responsive: [
    {
      breakpoint: 1200,
      settings: {
        slidesToShow: 2,
        slidesToScroll: 2,
        infinite: true,
        dots: false,
        arrows: true,
      },
    },
    {
      breakpoint: 1024,
      settings: {
        slidesToShow: 2,
        slidesToScroll: 2,
        infinite: true,
        dots: false,
        arrows: true,
      },
    },
    {
      breakpoint: 600,
      settings: {
        slidesToShow: 1,
        slidesToScroll: 1,
        dots: true,
        arrows: false,
      },
    },
    {
      breakpoint: 480,
      settings: {
        slidesToShow: 1,
        slidesToScroll: 1,
        dots: true,
        arrows: false,
      },
    },
  ],
});

$(".slick-slide-show-domain").slick({
  infinite: true,
  slidesToShow: 3,
  slidesToScroll: 3,
  draggable: true,
  margin: 10,
  centerPadding: "60",
  centerMode: true,

  responsive: [
    {
      breakpoint: 1200,
      settings: {
        slidesToShow: 3,
        slidesToScroll: 3,
        infinite: true,
        arrows: true,
        centerPadding: "60",
        centerMode: true,
        arrows: true,
      },
    },
    {
      breakpoint: 1024,
      settings: {
        slidesToShow: 3,
        slidesToScroll: 3,
        infinite: true,
        arrows: true,
        centerPadding: "60",
        centerMode: true,
        arrows: true,
      },
    },
    {
      breakpoint: 600,
      settings: {
        slidesToShow: 2,
        slidesToScroll: 2,
        dots: true,
        arrows: false,
        centerMode: false,
      },
    },
    {
      breakpoint: 480,
      settings: {
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: false,
        dots: true,
        centerMode: false,
      },
    },
  ],
});

$(document).ready(function () {
  $(".owl-carousel").owlCarousel({
    loop: true,
    margin: 8,
    responsive: {
      0: {
        items: 1,
        nav: false,
        dots: true,
        loop: true,
      },
      600: {
        items: 2,
        nav: false,
      },
      1000: {
        items: 3,
        nav: true,
        loop: false,
      },
    },
  });
});

// fancybox customisation
$("[data-fancybox]").fancybox({
  buttons: [
    "zoom",
    //"share",
    "slideShow",
    "fullScreen",
    "download",
    "thumbs",
    "close",
  ],
  protect: true,
  preventCaptionOverlap: true,
});

$(".slick-slide-show-partners").slick({
  infinite: true,
  slidesToShow: 3,
  slidesToScroll: 3,
  draggable: true,
  responsive: [
    {
      breakpoint: 1200,
      settings: {
        slidesToShow: 2,
        slidesToScroll: 2,
        infinite: true,
        dots: false,
        arrows: true,
      },
    },
    {
      breakpoint: 1024,
      settings: {
        slidesToShow: 2,
        slidesToScroll: 2,
        infinite: true,
        dots: false,
        arrows: true,
      },
    },
    {
      breakpoint: 600,
      settings: {
        slidesToShow: 1,
        slidesToScroll: 1,
        dots: true,
        arrows: false,
      },
    },
    {
      breakpoint: 480,
      settings: {
        slidesToShow: 1,
        slidesToScroll: 1,
        dots: true,
        arrows: false,
      },
    },
  ],
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("show");
    } else {
      entry.target.classList.remove("show");
    }
  });
});

const hiddenElements = document.querySelectorAll(".hidden");
hiddenElements.forEach((el) => observer.observe(el));

$(function () {
  $.ajax({
    url: window.location.origin + "/api/content/v1/search",
    type: "POST",
    data: `{
			"request":{
				"filters":{
					"contentType": ["Course"],
					"primaryCategory": ["Course"],
					"status": ["Live"],
					"batches.enrollmentType": "open",
					"batches.status": [ 1 ],
					"identifier":["do_1136238957658849281684","do_11370455974296780811593","do_11368467752313651211112","do_1136598919702609921643","do_1136640578114273281833","do_1136550347906744321351","do_1136550052517314561308","do_1136587508229734401555","do_1133739238734151681829","do_1135842468419502081641"]
				},
				"fields": [

				],
				"sort_by": {
					"lastPublishedOn": "desc"
				},
				"limit": 10
			}
		}`,
    processData: false,
    contentType: "application/json",
    success: function (response) {
      var latestCourses = response.result.content;
      var courseCardsCarausel = ``;
      var courseCard = ``;
      $.each(latestCourses, function (index, value) {
        if (!value.appIcon) {
          value.appIcon = "img/book.png";
        }
        courseCard = `
			<div ngxSlickItem class="slide">
						<div class="item">
							<div style="justify-content: center" class="d-flex">
								<div class="ui card p-0">
									<div class="bg-img-cover">
										<img src="images/abstract.svg" class="card-bg" />
									</div>
									<div class="small-bow">
										<a class="slider_info" href="#">
											<img class=" card_Circle" src="assets/images/book.png" alt=${
                        value.name
                      } width="305px" />
										</a>
										<input type="hidden" value=${value.identifier} />
										<div class="d-flex fw-bold pt-lg-5 mt-4 justify-content-end px-15">
											${value.se_boards[0]}
										</div>
										 <div class="px-15 pb-3">
											<div class="fw-bold truncate header py-15" title="${value.name}">${_.capitalize(
          value.name
        )}</div>
											<div class="truncate">${value.organisation[0]}</div>
											<!--div>Tags/ Keywords</div-->
										</div> 
									</div>
								</div>
							</div>
						</div>
					</div>
				   `;

        courseCardsCarausel += courseCard;
      });
      $("#popularCourseSection").html(courseCardsCarausel);
      $("#popularCourseSection").on("click", ".small-bow", function () {
        location.href = "/explore-course/course/" + $(this).find("input").val();
      });
      $(".course").slick({
        infinite: true,
        slidesToShow: 3.5,
        slidesToScroll: 3,
        draggable: true,
        responsive: [
          {
            breakpoint: 1200,
            settings: {
              slidesToShow: 2,
              slidesToScroll: 2,
              infinite: true,
              dots: false,
              arrows: true,
            },
          },
          {
            breakpoint: 1024,
            settings: {
              slidesToShow: 2,
              slidesToScroll: 2,
              infinite: true,
              dots: false,
              arrows: true,
            },
          },
          {
            breakpoint: 600,
            settings: {
              slidesToShow: 1,
              slidesToScroll: 1,
              dots: true,
              arrows: false,
            },
          },
          {
            breakpoint: 480,
            settings: {
              slidesToShow: 1,
              slidesToScroll: 1,
              dots: true,
              arrows: false,
            },
          },
        ],
      });
    },
  });
});

let title = document.querySelector(".firstWord");
let name = "Learning";
let index = 0;

const typeWriter = () => {
  let newTitle = name.slice(0, index);
  title.innerText = newTitle;

  index > name.length ? (index = 1) : index++;

  setTimeout(() => typeWriter(), 200);
};

// typeWriter();

let title2 = document.querySelector(".secondWord");
let name2 = "Collaboration";
let index2 = 0;

const typeWriter2 = () => {
  let newTitle2 = name2.slice(0, index2);
  title2.innerText = newTitle2;

  index2 > name2.length ? (index2 = 1) : index2++;

  setTimeout(() => typeWriter2(), 200);
};

typeWriter2();
