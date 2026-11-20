/*
 * Purpose: Frontend helper script. Connects provider pages to the backend API and handles shared page actions such as booking, location sharing, and provider-related interactions.
 * This file documents its responsibility; application logic is unchanged.
 */

/* Helper functions used by the provider pages */

/* Backend (Node.js + Express + MongoDB). Same server when opened via http://localhost:3000 */
var API = location.protocol === "file:" ? "http://localhost:3000/api" : "/api";

function api(path, options) {
    options = options || {};
    options.headers = Object.assign({ "Content-Type": "application/json" }, options.headers || {});
    return fetch(API + path, options).then(function (res) {
        return res.json().then(function (data) {
            if (!res.ok) throw new Error(data.error || "Request failed");
            return data;
        });
    });
}

/* Page info (service + city) read from the heading, e.g. "Electrician Services in Hyderabad" */
function pageInfo() {
    var h2 = document.querySelector("main h2");
    var m = h2 && h2.textContent.match(/^(.+?) Services in (.+)$/);
    return { service: m ? m[1] : "", city: m ? m[2] : "" };
}

/* Book Now: show the booking box for this provider */
function book(button) {
    var card = button.closest(".card");
    card.querySelector(".booking").style.display = "block";
    button.textContent = "Booking Started";
    button.disabled = true;
}

/* Get the user's location and show the sharing options */
function getLocation(button) {
    var card = button.closest(".card");
    var status = card.querySelector(".loc");
    var options = card.querySelector(".loc-actions");

    if (!navigator.geolocation) {
        status.textContent = "Your browser does not support location.";
        return;
    }

    status.textContent = "Getting your location...";

    navigator.geolocation.getCurrentPosition(
        function (position) {
            var link = "https://www.google.com/maps?q=" +
                position.coords.latitude + "," + position.coords.longitude;
            var phone = card.dataset.phone;
            var name = card.dataset.name;

            status.textContent = "Location found.";

            /* Booking module: save the booking in MongoDB (the page still works if the server is off) */
            var info = pageInfo();
            api("/bookings", {
                method: "POST",
                body: JSON.stringify({
                    providerName: name,
                    providerPhone: phone || "",
                    service: info.service,
                    city: info.city,
                    locationLink: link
                })
            }).then(function () {
                status.textContent = "Location found. Booking saved.";
            }).catch(function () { /* server offline: location sharing still works */ });

            options.innerHTML = '<a class="button outline" href="' + link + '" target="_blank">Open in Google Maps</a> ' +
                '<button onclick="copyLink(\'' + link + '\', this)">Copy Link</button>';

            if (phone) {
                var text = "Hello " + name + ", I booked you on QuickService. My location: " + link;
                options.innerHTML += ' <a class="button" target="_blank" href="https://wa.me/91' + phone +
                    '?text=' + encodeURIComponent(text) + '">Send on WhatsApp</a>';
            }
        },
        function () {
            status.textContent = "Could not get your location. Please allow location access.";
        }
    );
}

/* Copy the location link */
function copyLink(link, button) {
    navigator.clipboard.writeText(link);
    button.textContent = "Copied";
}


/* City listings without published phone numbers: keep contact actions honest. */
function contactUnavailable(button) {
    var card = button.closest(".card");
    var notice = card.querySelector(".contact-notice");
    if (!notice) {
        notice = document.createElement("p");
        notice.className = "contact-notice muted";
        notice.setAttribute("role", "status");
        card.querySelector(".actions").insertAdjacentElement("afterend", notice);
    }
    notice.textContent = "Contact number is not listed for this provider yet. You can still use Book Now to share your location.";
}


/* ---------- Admin verification badge + Ratings on the city pages ---------- */

function keyFor(card) {
    return card.dataset.phone || card.dataset.name;
}

function addRatingWidget(card) {
    var box = document.createElement("div");
    box.className = "rate";
    box.innerHTML = '<span class="stars" aria-label="Rate this provider"></span> ' +
        '<span class="rate-msg muted">Rate this provider</span>' +
        '<div class="rate-form hidden"><textarea rows="2" maxlength="500" placeholder="Optional comment"></textarea>' +
        '<button type="button" class="rate-send">Submit rating</button></div>';
    card.appendChild(box);

    var stars = box.querySelector(".stars");
    var form = box.querySelector(".rate-form");
    var msg = box.querySelector(".rate-msg");
    var chosen = 0;

    function paint(n) {
        Array.prototype.forEach.call(stars.children, function (b, i) { b.textContent = i < n ? "★" : "☆"; });
    }
    for (var i = 1; i <= 5; i++) {
        (function (n) {
            var b = document.createElement("button");
            b.type = "button";
            b.textContent = "☆";
            b.setAttribute("aria-label", n + " star" + (n > 1 ? "s" : ""));
            b.onclick = function () { chosen = n; paint(n); form.classList.remove("hidden"); msg.textContent = n + " / 5"; };
            stars.appendChild(b);
        })(i);
    }

    box.querySelector(".rate-send").onclick = function () {
        var btn = this;
        btn.disabled = true;
        api("/ratings", {
            method: "POST",
            body: JSON.stringify({
                providerKey: keyFor(card),
                providerName: card.dataset.name,
                stars: chosen,
                comment: form.querySelector("textarea").value
            })
        }).then(function () {
            form.classList.add("hidden");
            msg.textContent = "Thanks for your rating!";
            loadCustomerRating(card, box);
        }).catch(function (e) {
            btn.disabled = false;
            msg.textContent = "Could not save: " + e.message;
        });
    };
    loadCustomerRating(card, box);
}

/* show the average given by QuickService customers (separate from the public listing rating) */
function loadCustomerRating(card, box) {
    api("/ratings/" + encodeURIComponent(keyFor(card))).then(function (r) {
        var out = box.querySelector(".cust-rating");
        if (!out) {
            out = document.createElement("p");
            out.className = "cust-rating muted";
            box.insertBefore(out, box.firstChild);
        }
        out.textContent = r.count ? "QuickService customers: " + r.average + " / 5 (" + r.count + " rating" + (r.count > 1 ? "s" : "") + ")" : "No QuickService ratings yet.";
    }).catch(function () {});
}

function markVerified(card) {
    var tag = card.querySelector(".tag");
    if (!tag) {
        tag = document.createElement("p");
        tag.className = "tag";
        card.querySelector("h3").insertAdjacentElement("afterend", tag);
    }
    tag.className = "badge verified";
    tag.textContent = "✔ Verified by QuickService";
}

document.addEventListener("DOMContentLoaded", function () {
    var cards = document.querySelectorAll(".card[data-name]");
    if (!cards.length) return;

    cards.forEach(addRatingWidget);

    api("/providers/verified-index").then(function (list) {
        var info = pageInfo();
        var byPhone = {}, byName = {};
        list.forEach(function (p) {
            if (p.phone) byPhone[p.phone] = true;
            byName[(p.name + "|" + p.city).toLowerCase()] = true;
        });
        cards.forEach(function (card) {
            var hit = (card.dataset.phone && byPhone[card.dataset.phone]) ||
                byName[(card.dataset.name + "|" + info.city).toLowerCase()];
            if (hit) markVerified(card);
        });
    }).catch(function () { /* server offline: cards stay as "Public listing" */ });
});
