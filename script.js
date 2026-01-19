class DoctorManagementSystem {
    constructor() {
        this.doctorsData = [];
        this.chambersData = [];
        this.currentUser = null;
        this.currentAdminChamber = null;
        this.editingDoctorId = null;
        this.updatingFilters = false;

        this.adminCredentials = {
            'Health Point Nursing Home (Prabir Hazra)': 'admin123',
            'Modern, Jangipara': 'admin456',
            'RCC Medical Center': 'admin789'
        };

        this.init();
    }

    /* ===========================
       🔑 NORMALIZATION HELPERS
    ============================ */
    normalizeName(name) {
        return (name || '')
            .toLowerCase()
            .replace(/\s+/g, ' ')
            .trim();
    }

    /* ===========================
       INIT
    ============================ */
    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.showLoginSection();
    }

    /* ===========================
       DATA LOADING (FIXES HERE)
    ============================ */
    async loadData() {
        const response = await fetch('output.json');
        const data = await response.json();

        this.chambersData = (data.chambers || []).filter(c => c && c.name);
        this.doctorsData = (data.doctors || []).filter(d => d && d.name);

        /* ===========================
           ✅ FIX #2: BUILD CHAMBER-SPECIFIC AVAILABILITY
        ============================ */
        this.doctorsData = this.doctorsData.map(doctor => {
            const chamberAvailability = {};

            (doctor.chambers || []).forEach(ch => {
                chamberAvailability[ch] = [];
            });

            (doctor.weekavailability || []).forEach(slot => {
                if (!slot.day || !slot.time) return;

                (doctor.chambers || []).forEach(ch => {
                    chamberAvailability[ch].push(slot);
                });
            });

            return {
                ...doctor,
                chamberAvailability
            };
        });

        this.populateChamberOptions();
    }

    populateChamberOptions() {
        const select = document.getElementById('username');
        if (!select) return;

        select.innerHTML = '<option value="">-- Select Chamber --</option>';
        Object.keys(this.adminCredentials).forEach(c => {
            select.append(new Option(c, c));
        });
    }

    /* ===========================
       LOGIN / VIEW
    ============================ */
    showLoginSection() {
        this.hideAllSections();
        document.getElementById('login-section').classList.remove('hidden');
    }

    showPatientView() {
        this.currentUser = 'patient';
        this.hideAllSections();
        document.getElementById('filters').classList.remove('hidden');
        document.getElementById('doctor-list').classList.remove('hidden');
        this.populateFilters();
        this.displayDoctors(this.doctorsData);
        this.updateChamberSidebar(this.doctorsData);
    }

    /* ===========================
       FILTERS
    ============================ */
    populateFilters() {
        const departments = [...new Set(this.doctorsData.map(d => d.department).filter(Boolean))];
        const doctors = [...new Set(this.doctorsData.map(d => d.name))];
        const chambers = [...new Set(this.doctorsData.flatMap(d => d.chambers || []))];

        this.populateDropdown('department', departments);
        this.populateDropdown('doctor', doctors);
        this.populateDropdown('chamber', chambers);
    }

    populateDropdown(id, options) {
        const el = document.getElementById(id);
        if (!el) return;

        $(el).select2('destroy');
        el.innerHTML = `<option value="">-- Select --</option>`;
        options.sort().forEach(o => el.append(new Option(o, o)));
        $(el).select2({ allowClear: true });
    }

    /* ===========================
       DISPLAY DOCTORS (MAIN FIX)
    ============================ */
    displayDoctors(doctors) {
        const grid = document.getElementById('doctor-grid');
        grid.innerHTML = '';

        if (!doctors.length) {
            grid.innerHTML = '<p class="text-center">No doctors found</p>';
            return;
        }

        doctors.forEach(doctor => {
            grid.appendChild(this.createDoctorCard(doctor));
        });
    }

    createDoctorCard(doctor) {
        const card = document.createElement('div');
        card.className = 'doctor-card';

        const chambersHtml = (doctor.chambers || []).map(chamber => {
            const info = this.getChamberInfo(chamber);
            const availability = doctor.chamberAvailability?.[chamber] || [];

            return `
                <div class="chamber-block">
                    <div class="chamber-name">${chamber}</div>
                    <div class="chamber-detail">📞 ${info.phone.join(', ') || 'N/A'}</div>
                    <div class="chamber-detail">📍 ${info.address || 'N/A'}</div>
                    <div class="chamber-detail">
                        🕒 ${
                            availability.length
                                ? availability.map(a =>
                                    `${a.day}: ${a.time.join(', ')}`
                                  ).join(' | ')
                                : 'Not available'
                        }
                    </div>
                </div>
            `;
        }).join('');

        card.innerHTML = `
            <div class="doctor-header">
                <div>
                    <div class="doctor-name">${doctor.name}</div>
                    <div class="doctor-department">${doctor.department || ''}</div>
                </div>
            </div>
            <div class="doctor-info">${chambersHtml}</div>
        `;

        return card;
    }

    /* ===========================
       🔧 FIX #1: CHAMBER LOOKUP
    ============================ */
    getChamberInfo(name) {
        const target = this.normalizeName(name);
        const chamber = this.chambersData.find(c =>
            this.normalizeName(c.name) === target
        );

        if (!chamber) return { phone: [], address: '' };

        return {
            phone: Array.isArray(chamber.phone)
                ? chamber.phone.flatMap(p => p.split('/').map(x => x.trim()))
                : [],
            address: chamber.address || ''
        };
    }

    /* ===========================
       SIDEBAR
    ============================ */
    updateChamberSidebar(doctors = this.doctorsData) {
        const sidebar = document.getElementById('chamber-sidebar');
        if (!sidebar) return;

        const chambers = new Set();
        doctors.forEach(d => (d.chambers || []).forEach(c => chambers.add(c)));

        if (!chambers.size) {
            sidebar.innerHTML = '<p class="no-chambers">No chambers found</p>';
            return;
        }

        sidebar.innerHTML = [...chambers].sort().map(c => {
            const info = this.getChamberInfo(c);
            return `
                <div class="chamber-item">
                    <div class="chamber-name">${c}</div>
                    <div class="chamber-detail-item phone">
                        <strong>Phone:</strong> ${info.phone.join(', ') || 'N/A'}
                    </div>
                </div>
            `;
        }).join('');
    }

    /* ===========================
       EVENTS
    ============================ */
    setupEventListeners() {
        document.getElementById('patient-view-btn')
            ?.addEventListener('click', () => this.showPatientView());
    }

    hideAllSections() {
        ['login-section', 'admin-panel', 'filters', 'doctor-list']
            .forEach(id => document.getElementById(id)?.classList.add('hidden'));
    }
}

/* ===========================
   BOOTSTRAP
=========================== */
document.addEventListener('DOMContentLoaded', () => {
    $('.select2').select2({ allowClear: true });
    window.doctorSystem = new DoctorManagementSystem();
});
