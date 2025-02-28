document.addEventListener("DOMContentLoaded", () => {
    // Enable Select2 dropdown with search functionality
    $(".select2").select2();

    const doctorList = document.querySelector("#doctor-list ul");
    const searchButton = document.querySelector("#search");
    const departmentFilter = document.querySelector("#department");
    const doctorFilter = document.querySelector("#doctor");
    const chamberFilter = document.querySelector("#chamber");
    
    let doctorsData = [];
    let doctorToDepartmentMap = new Map();
    let chamberMap = new Map();

    // Load JSON data from output.json
    async function loadDoctors() {
        try {
            const response = await fetch("output.json");
            const data = await response.json();
            doctorsData = data.doctors;
            processChambers(data.chambers);
            resetAvailabilityIfSunday();
            populateFilters(doctorsData);
            displayDoctors(doctorsData);
        } catch (error) {
            console.error("Error loading JSON:", error);
        }
    }

    function processChambers(chambers) {
        chambers.forEach(chamber => {
            chamberMap.set(chamber.name, chamber.phone || "N/A");
        });
    }

    function resetAvailabilityIfSunday() {
        const now = new Date();
        if (now.getDay() === 0 && now.getHours() === 23 && now.getMinutes() >= 55) {
            doctorsData.forEach(doctor => {
                doctor.weekavailability = JSON.parse(JSON.stringify(doctor.defaultavailability));
            });
            console.log("Availability reset to default.");
        }
    }

    function populateFilters(doctors) {
        const departments = new Set();
        const doctorsSet = new Map();
        const chambers = new Set();

        doctors.forEach(doc => {
            departments.add(doc.department);
            doctorsSet.set(doc.name, doc.department);
            doctorToDepartmentMap.set(doc.name, doc.department);
            doc.chambers.forEach(chamberName => chambers.add(chamberName));
        });

        populateDropdown(departmentFilter, [...departments]);
        populateDropdown(doctorFilter, [...doctorsSet.keys()], doctorsSet);
        populateDropdown(chamberFilter, [...chambers]);
    }

    function populateDropdown(dropdown, values) {
        dropdown.innerHTML = '<option value="">-- Select --</option>';
        values.forEach(value => {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = value;
            dropdown.appendChild(option);
        });
    }

    doctorFilter.addEventListener("change", function() {
        if (doctorToDepartmentMap.has(this.value)) {
            departmentFilter.value = doctorToDepartmentMap.get(this.value);
        }
    });

    function displayDoctors(doctors) {
        doctorList.innerHTML = "";
        doctors.forEach(doctor => {
            const chamberDetails = doctor.chambers.map(chamberName => {
                const phone = chamberMap.get(chamberName) || "N/A";
                return `${chamberName} (Phone: ${phone})`;
            }).join(", ");
            
            const availability = doctor.weekavailability.map(slot => `${slot.day}: ${convertTo12Hour(slot.time)}`).join(" | ");
            
            const listItem = document.createElement("li");
            listItem.innerHTML = `<strong>${doctor.name}</strong> - ${doctor.department} <br> Chambers: ${chamberDetails} <br> Availability: ${availability}`;
            doctorList.appendChild(listItem);
        });
    }

    function convertTo12Hour(timeArray) {
        return timeArray.map(time => {
            let [hour, minute] = time.split(":");
            hour = parseInt(hour, 10);
            const ampm = hour >= 12 ? "PM" : "AM";
            hour = hour % 12 || 12;
            return `${hour}:${minute} ${ampm}`;
        }).join(", ");
    }

    searchButton.addEventListener("click", () => {
        const selectedDepartment = departmentFilter.value;
        const selectedDoctor = doctorFilter.value;
        const selectedChamber = chamberFilter.value;
        
        let filteredDoctors = doctorsData;

        if (selectedDepartment) {
            filteredDoctors = filteredDoctors.filter(doc => doc.department === selectedDepartment);
        }

        if (selectedDoctor) {
            filteredDoctors = filteredDoctors.filter(doc => doc.name === selectedDoctor);
            if (filteredDoctors.length > 0) {
                departmentFilter.value = filteredDoctors[0].department;
            }
        }

        if (selectedChamber) {
            filteredDoctors = filteredDoctors.filter(doc => doc.chambers.includes(selectedChamber));
        }

        displayDoctors(filteredDoctors);
    });

    loadDoctors();
    setInterval(resetAvailabilityIfSunday, 60000);
});
