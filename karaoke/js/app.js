// Create "back to top" button
const backToTopButton = document.getElementById("backToTop");

window.addEventListener("scroll", function () {
    if (window.pageYOffset > 300) {
        // Show button after scrolling 300px
        backToTopButton.classList.add("visible");
    } else {
        backToTopButton.classList.remove("visible");
    }
});

backToTopButton.addEventListener("click", function () {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});

// Current week tracking
let currentWeekStart = getStartOfWeek(new Date());
let showDedicated = true;
const today = new Date().toDateString();

// Helper functions
function getStartOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day;
    return new Date(d.setDate(diff));
}

function isToday(date) {
    return date.toDateString() === today;
}

function formatWeekRange(startDate) {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    const options = { month: "short", day: "numeric" };
    const startStr = startDate.toLocaleDateString("en-US", options);
    const endStr = endDate.toLocaleDateString("en-US", { ...options, year: "numeric" });

    return `Week of ${startStr} - ${endStr}`;
}

function isOrdinalDate(date, ordinal, dayName) {
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    const lastDay = new Date(year, month + 1, 0).getDate();

    const occurrences = [];
    for (let d = 1; d <= lastDay; d++) {
        const testDate = new Date(year, month, d);
        if (testDate.toLocaleDateString("en-US", { weekday: "long" }) === dayName) {
            occurrences.push(d);
        }
    }

    const ordinalIndex = { first: 0, second: 1, third: 2, fourth: 3, last: occurrences.length - 1 }[ordinal];
    return occurrences[ordinalIndex] === day;
}

function hasKaraokeOnDate(venue, date) {
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });

    if (venue.schedule.weekly[dayName]) {
        return {
            hasEvent: true,
            timeInfo: {
                time: venue.schedule.weekly[dayName],
                description: "Weekly karaoke"
            }
        };
    }

    for (const ordinalEvent of venue.schedule.ordinal) {
        const [ordinal, ordinalDay] = ordinalEvent.day;
        if (ordinalDay === dayName && isOrdinalDate(date, ordinal, ordinalDay)) {
            return {
                hasEvent: true,
                timeInfo: {
                    time: ordinalEvent.time,
                    description: ordinalEvent.description
                }
            };
        }
    }

    return { hasEvent: false };
}

function createMapLink(venue) {
    const address = `${venue.VenueName} ${venue.Address.Street}, ${venue.Address.City} ${venue.Address.State} ${venue.Address.Zip}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}

function createSocialLinks(venue) {
    const socials = [];

    // Always include map link
    socials.push(
        `<a href="${createMapLink(venue)}" target="_blank" title="View on Google Maps"><i class="fas fa-map-marker-alt"></i></a>`
    );

    // Check each social media platform
    if (venue.socials.Facebook) {
        socials.push(
            `<a href="${venue.socials.Facebook}" target="_blank" title="Facebook"><i class="fab fa-facebook"></i></a>`
        );
    }
    if (venue.socials.Instagram) {
        socials.push(
            `<a href="${venue.socials.Instagram}" target="_blank" title="Instagram"><i class="fab fa-instagram"></i></a>`
        );
    }
    if (venue.socials.Website) {
        socials.push(
            `<a href="${venue.socials.Website}" target="_blank" title="Website"><i class="fas fa-globe"></i></a>`
        );
    }
    if (venue.socials.Bluesky) {
        socials.push(
            `<a href="${venue.socials.Bluesky}" target="_blank" title="Bluesky"><i class="fa-brands fa-bluesky"></i></a>`
        );
    }
    if (venue.socials.Tiktok) {
        socials.push(
            `<a href="${venue.socials.Tiktok}" target="_blank" title="TikTok"><i class="fab fa-tiktok"></i></a>`
        );
    }
    if (venue.socials.Twitter) {
        socials.push(
            `<a href="${venue.socials.Twitter}" target="_blank" title="Twitter"><i class="fab fa-twitter"></i></a>`
        );
    }
    if (venue.socials.Youtube) {
        socials.push(
            `<a href="${venue.socials.Youtube}" target="_blank" title="Twitter"><i class="fab fa-youtube"></i></a>`
        );
    }

    return `<div class="social-links">${socials.join("")}</div>`;
}

function formatAddress(venue) {
    return `${venue.Address.Street}<br>${venue.Address.City}, ${venue.Address.State}, ${venue.Address.Zip}`;
}

function renderWeek() {
    const weekDisplay = document.getElementById("week-display");
    const container = document.getElementById("schedule-container");

    weekDisplay.textContent = formatWeekRange(currentWeekStart);
    container.innerHTML = "";

    for (let i = 0; i < 7; i++) {
        const currentDate = new Date(currentWeekStart);
        currentDate.setDate(currentDate.getDate() + i);
        const isCurrentDay = isToday(currentDate);

        const venuesToday = karaokeData.listings
            .map((venue) => {
                const { hasEvent, timeInfo } = hasKaraokeOnDate(venue, currentDate);
                return hasEvent ? { ...venue, timeInfo } : null;
            })
            .filter((venue) => venue && (showDedicated || !venue.Dedicated))
            .sort((a, b) => a.VenueName.localeCompare(b.VenueName));

        const dayHTML = `
                        <div class="day-card">
                            <div class="day-header ${isCurrentDay ? "today" : ""}">
                                <span>${currentDate.toLocaleDateString("en-US", { weekday: "long" })}</span>
                                <span class="date-number ${isCurrentDay ? "today" : ""}">
                                    ${currentDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                </span>
                            </div>
                            <div class="venue-list">
                                ${
                                    venuesToday.length > 0
                                        ? venuesToday
                                              .map(
                                                  (venue) => `
                                        <div class="venue-item">
                                            <div class="venue-name">${venue.VenueName}</div>
                                            <div class="venue-kj">${venue.KJ.Company ? `${venue.KJ.Company}<br>` : ""}${venue.KJ.Host ? ` with ${venue.KJ.Host}` : ""}</div>
                                            <div class="venue-time">${venue.timeInfo.time}${venue.timeInfo.description ? ` <span class="time-description">(${venue.timeInfo.description})</span>` : ""}</div>
                                            <div class="venue-address"><a href="${createMapLink(venue)}" target="_blank" title="View on Google Maps">${formatAddress(venue)}</a></div>
                                            ${createSocialLinks(venue)}
                                        </div>
                                    `
                                              )
                                              .join("")
                                        : '<div class="no-events">No karaoke venues scheduled</div>'
                                }
                            </div>
                        </div>
                    `;

        container.insertAdjacentHTML("beforeend", dayHTML);
    }
}

// Initialize the page
document.getElementById("prev-week").addEventListener("click", () => {
    currentWeekStart.setDate(currentWeekStart.getDate() - 7);
    renderWeek();
});

document.getElementById("next-week").addEventListener("click", () => {
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    renderWeek();
});

document.getElementById("this-week").addEventListener("click", () => {
    currentWeekStart = getStartOfWeek(new Date());
    renderWeek();
});

document.getElementById("dedicated-toggle").addEventListener("change", function () {
    showDedicated = this.checked;
    renderWeek();
});

renderWeek();
