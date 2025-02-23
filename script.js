document.addEventListener("DOMContentLoaded", () => {
    const doctorList = document.querySelector("#doctor-list ul");
    const searchButton = document.querySelector("#search");
    const departmentFilter = document.querySelector("#department");
    const doctorFilter = document.querySelector("#doctor");
    const chamberFilter = document.querySelector("#chamber");

    let doctorsData = [];

    // Load JSON data from uploaded file
    async function loadDoctors() {
        try {
            const response = await fetch("output.json");
            const data = await response.json();
            doctorsData = data;
            populateFilters(doctorsData);
            displayDoctors(doctorsData);
        } catch (error) {
            console.error("Error loading JSON:", error);
        }
    }

    // Populate department, doctor, and chamber dropdowns dynamically
    function populateFilters(doctors) {
        const departments = new Set();
        const doctorsSet = new Set();
        const chambers = new Set();

        doctors.forEach(doc => {
            departments.add(doc.department);
            doctorsSet.add(doc.name);
            doc.chambers.forEach(chamber => chambers.add(chamber));
        });

        populateDropdown(departmentFilter, departments);
        populateDropdown(doctorFilter, doctorsSet);
        populateDropdown(chamberFilter, chambers);
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

    // Display doctors dynamically
    function displayDoctors(doctors) {
        doctorList.innerHTML = "";
        doctors.forEach(doctor => {
            const chamberNames = doctor.chambers.join(", ");
            const availability = doctor.weekavailability.map(slot => `${slot.day}: ${slot.time.join(", ")}`).join(" | ");
            
            const listItem = document.createElement("li");
            listItem.innerHTML = `<strong>${doctor.name}</strong> - ${doctor.department} <br> Chambers: ${chamberNames} <br> Availability: ${availability}`;
            doctorList.appendChild(listItem);
        });
    }

    // Filter functionality
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
        }

        if (selectedChamber) {
            filteredDoctors = filteredDoctors.filter(doc => doc.chambers.includes(selectedChamber));
        }

        displayDoctors(filteredDoctors);
    });

    // Initialize
    loadDoctors();
});
