/**
 * Doctor Management System - Enhanced Version
 * Features: Admin login, chamber-specific management, schedule editing, modern UI
 */

class DoctorManagementSystem {
    constructor() {
        this.doctorsData = [];
        this.chambersData = [];
        this.currentUser = null;
        this.currentAdminChamber = null;
        this.editingDoctorId = null;
        this.updatingFilters = false; // Flag to prevent recursive updates
        
        // Admin credentials (in real app, this would be server-side)
        this.adminCredentials = {
            'Health Point Nursing Home (P. Hazra)': 'admin123',
            'Modern Jangipara': 'admin456',
            'RCC Medical Center': 'admin789'
        };
        
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            this.setupEventListeners();
            this.showLoginSection();
            this.startAvailabilityReset();
        } catch (error) {
            console.error('Error initializing system:', error);
            this.showError('Failed to load system data');
        }
    }

    async loadData() {
        try {
            const response = await fetch('output.json');
            const data = await response.json();
            this.doctorsData = data.doctors || [];
            this.chambersData = data.chambers || [];
            this.populateChamberOptions();
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
        }
    }

    populateChamberOptions() {
        const chamberSelect = document.getElementById('username');
        chamberSelect.innerHTML = '<option value="">-- Select Chamber --</option>';
        
        Object.keys(this.adminCredentials).forEach(chamber => {
            const option = document.createElement('option');
            option.value = chamber;
            option.textContent = chamber;
            chamberSelect.appendChild(option);
        });
    }

    setupEventListeners() {
        // Login system
        document.getElementById('admin-login-btn').addEventListener('click', () => this.showLoginModal());
        document.getElementById('patient-view-btn').addEventListener('click', () => this.loginAsPatient());
        document.getElementById('login-form').addEventListener('submit', (e) => this.handleAdminLogin(e));
        document.getElementById('cancel-login').addEventListener('click', () => this.hideModal('login-modal'));
        document.getElementById('logout-btn').addEventListener('click', () => this.logout());

        // Admin panel
        document.getElementById('add-doctor-btn').addEventListener('click', () => this.showAddDoctorModal());
        document.getElementById('view-all-btn').addEventListener('click', () => this.viewAllDoctors());
        document.getElementById('add-doctor-form').addEventListener('submit', (e) => this.handleAddDoctor(e));
        document.getElementById('cancel-add-doctor').addEventListener('click', () => this.hideModal('add-doctor-modal'));

        // Filters and search
        document.getElementById('search').addEventListener('click', () => this.searchDoctors());
        document.getElementById('clear-filters').addEventListener('click', () => this.clearFilters());

        // Modal close handlers
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.hideModal(modal.id);
                }
            });
        });

        // Schedule editor
        document.getElementById('add-schedule-btn').addEventListener('click', () => this.addScheduleItem());
        document.getElementById('save-schedule').addEventListener('click', () => this.saveSchedule());
        document.getElementById('cancel-schedule').addEventListener('click', () => this.hideModal('schedule-modal'));

        // Click outside modal to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal.id);
                }
            });
        });
    }

    // Login System
    showLoginSection() {
        this.hideAllSections();
        document.getElementById('login-section').classList.remove('hidden');
    }

    showLoginModal() {
        this.showModal('login-modal');
    }

    async handleAdminLogin(e) {
        e.preventDefault();
        const chamber = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (this.adminCredentials[chamber] && this.adminCredentials[chamber] === password) {
            this.currentUser = 'admin';
            this.currentAdminChamber = chamber;
            this.hideModal('login-modal');
            this.showAdminPanel();
            this.showSuccess(`Welcome! Logged in as admin for ${chamber}`);
        } else {
            this.showError('Invalid credentials');
        }
    }

    loginAsPatient() {
        this.currentUser = 'patient';
        this.currentAdminChamber = null;
        this.showPatientView();
    }

    logout() {
        this.currentUser = null;
        this.currentAdminChamber = null;
        this.showLoginSection();
        this.showInfo('Logged out successfully');
    }

    // Admin Panel
    showAdminPanel() {
        this.hideAllSections();
        document.getElementById('admin-panel').classList.remove('hidden');
        document.getElementById('filters').classList.remove('hidden');
        document.getElementById('doctor-list').classList.remove('hidden');
        document.getElementById('admin-chamber').textContent = this.currentAdminChamber;
        this.populateFilters();
        const chamberDoctors = this.getChamberDoctors();
        this.displayDoctors(chamberDoctors);
        this.updateChamberSidebar(chamberDoctors);
    }

    showPatientView() {
        this.hideAllSections();
        document.getElementById('filters').classList.remove('hidden');
        document.getElementById('doctor-list').classList.remove('hidden');
        this.populateFilters();
        this.displayDoctors(this.doctorsData);
        this.updateChamberSidebar(this.doctorsData);
    }

    getChamberDoctors() {
        if (!this.currentAdminChamber) return this.doctorsData;
        return this.doctorsData.filter(doctor => 
            doctor.chambers && doctor.chambers.includes(this.currentAdminChamber)
        );
    }

    viewAllDoctors() {
        this.populateFilters();
        document.getElementById('filters').classList.remove('hidden');
        document.getElementById('doctor-list').classList.remove('hidden');
        this.displayDoctors(this.doctorsData);
        this.updateChamberSidebar(this.doctorsData);
        this.showSuccess('Showing all doctors in the system');
    }

    // Doctor Management
    showAddDoctorModal() {
        this.hideModal('add-doctor-modal');
        document.getElementById('add-doctor-form').reset();
        this.showModal('add-doctor-modal');
    }

    async handleAddDoctor(e) {
        e.preventDefault();
        const name = document.getElementById('new-doctor-name').value;
        const department = document.getElementById('new-doctor-dept').value;
        const chambersText = document.getElementById('new-doctor-chambers').value;
        
        const chambers = chambersText.split(',').map(c => c.trim()).filter(c => c);
        
        if (!chambers.includes(this.currentAdminChamber)) {
            chambers.push(this.currentAdminChamber);
        }

        const newDoctor = {
            id: this.doctorsData.length + 1,
            name: name,
            department: department,
            chambers: chambers,
            weekavailability: [],
            defaultavailability: []
        };

        this.doctorsData.push(newDoctor);
        this.hideModal('add-doctor-modal');
        this.displayDoctors(this.getChamberDoctors());
        this.showSuccess(`Doctor ${name} added successfully`);
    }

    editDoctor(doctorId) {
        const doctor = this.doctorsData.find(d => d.id === doctorId);
        if (!doctor) return;

        this.editingDoctorId = doctorId;
        document.getElementById('schedule-modal-title').textContent = `Edit Schedule - ${doctor.name}`;
        this.populateScheduleEditor(doctor);
        this.showModal('schedule-modal');
    }

    deleteDoctor(doctorId) {
        const doctor = this.doctorsData.find(d => d.id === doctorId);
        if (!doctor) return;

        if (confirm(`Are you sure you want to delete ${doctor.name}?`)) {
            this.doctorsData = this.doctorsData.filter(d => d.id !== doctorId);
            this.displayDoctors(this.getChamberDoctors());
            this.showSuccess(`Doctor ${doctor.name} deleted successfully`);
        }
    }

    // Schedule Management
    populateScheduleEditor(doctor) {
        const scheduleList = document.getElementById('schedule-list');
        scheduleList.innerHTML = '';

        if (!doctor.weekavailability || doctor.weekavailability.length === 0) {
            scheduleList.innerHTML = '<p class="text-center">No schedule set</p>';
            return;
        }

        doctor.weekavailability.forEach((schedule, index) => {
            const scheduleItem = document.createElement('div');
            scheduleItem.className = 'schedule-item';
            scheduleItem.innerHTML = `
                <div>
                    <span class="schedule-time">${schedule.day}</span>
                    <span>: ${this.formatTimeArray(schedule.time)}</span>
                </div>
                <button type="button" class="btn-danger" onclick="doctorSystem.removeScheduleItem(${index})">Remove</button>
            `;
            scheduleList.appendChild(scheduleItem);
        });
    }

    removeScheduleItem(index) {
        const doctor = this.doctorsData.find(d => d.id === this.editingDoctorId);
        if (doctor && doctor.weekavailability) {
            doctor.weekavailability.splice(index, 1);
            this.populateScheduleEditor(doctor);
        }
    }

    addScheduleItem() {
        const day = document.getElementById('new-schedule-day').value;
        const time = document.getElementById('new-schedule-time').value;
        
        if (!day || !time) {
            this.showError('Please select both day and time');
            return;
        }

        const doctor = this.doctorsData.find(d => d.id === this.editingDoctorId);
        if (!doctor) return;

        if (!doctor.weekavailability) {
            doctor.weekavailability = [];
        }

        // Check if day already exists
        const existingDayIndex = doctor.weekavailability.findIndex(s => s.day === day);
        if (existingDayIndex >= 0) {
            // Add time to existing day
            if (!doctor.weekavailability[existingDayIndex].time.includes(time)) {
                doctor.weekavailability[existingDayIndex].time.push(time);
            }
        } else {
            // Create new day
            doctor.weekavailability.push({
                day: day,
                time: [time]
            });
        }

        // Sort by day
        doctor.weekavailability.sort((a, b) => {
            const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
            return days.indexOf(a.day) - days.indexOf(b.day);
        });

        this.populateScheduleEditor(doctor);
        
        // Clear form
        document.getElementById('new-schedule-day').value = '';
        document.getElementById('new-schedule-time').value = '';
    }

    saveSchedule() {
        const doctor = this.doctorsData.find(d => d.id === this.editingDoctorId);
        if (doctor) {
            // Update defaultavailability to match weekavailability
            doctor.defaultavailability = JSON.parse(JSON.stringify(doctor.weekavailability));
            this.hideModal('schedule-modal');
            this.displayDoctors(this.getChamberDoctors());
            this.showSuccess('Schedule updated successfully');
        }
    }

    // Search and Filters
    populateFilters() {
        // Clear all filters first
        const deptSelect = document.getElementById('department');
        const doctorSelect = document.getElementById('doctor');
        const chamberSelect = document.getElementById('chamber');
        const daySelect = document.getElementById('day-filter');
        
        if (deptSelect) deptSelect.value = '';
        if (doctorSelect) doctorSelect.value = '';
        if (chamberSelect) chamberSelect.value = '';
        if (daySelect) daySelect.value = '';
        
        // Initial population with all options
        this.updateFilterOptions();
        
        // Setup dynamic filter event listeners (only if not already set up)
        // We check by looking for existing listeners - simple approach is to remove and re-add
        this.setupDynamicFilters();
    }

    setupDynamicFilters() {
        // Use jQuery to bind Select2 change events
        // Remove any existing handlers first to avoid duplicates
        $('#department').off('change.select2');
        $('#doctor').off('change.select2');
        $('#chamber').off('change.select2');
        $('#day-filter').off('change.select2');
        
        // Also listen to native change events as fallback
        $('#department').off('change');
        $('#doctor').off('change');
        $('#chamber').off('change');
        $('#day-filter').off('change');
        
        // Bind new handlers
        $('#department').on('change.select2 change', () => {
            if (!this.updatingFilters) {
                this.updateFilterOptions('department');
            }
        });

        $('#doctor').on('change.select2 change', () => {
            if (!this.updatingFilters) {
                this.updateFilterOptions('doctor');
            }
        });

        $('#chamber').on('change.select2 change', () => {
            if (!this.updatingFilters) {
                this.updateFilterOptions('chamber');
            }
        });

        $('#day-filter').on('change.select2 change', () => {
            if (!this.updatingFilters) {
                this.updateFilterOptions('day');
            }
        });
    }

    updateFilterOptions(changedFilter = null) {
        this.updatingFilters = true; // Prevent recursive updates
        
        // Use jQuery to get Select2 values (more reliable)
        const departmentValue = $('#department').val() || '';
        const doctorValue = $('#doctor').val() || '';
        const chamberValue = $('#chamber').val() || '';
        const dayValue = $('#day-filter').val() || '';
        
        console.log('Filter update:', { changedFilter, departmentValue, doctorValue, chamberValue, dayValue });

        // Get base dataset (admin sees only their chamber doctors, patient sees all)
        let baseDoctors = this.currentUser === 'admin' ? this.getChamberDoctors() : this.doctorsData;
        
        // Safety check - ensure we have data
        if (!baseDoctors || baseDoctors.length === 0) {
            console.warn('No doctor data available for filtering');
            this.updatingFilters = false;
            return;
        }

        // Build available options for each filter based on current selections
        const availableDepartments = new Set();
        const availableDoctors = new Map();
        const availableChambers = new Set();
        const availableDays = new Set();

        // Start with all base doctors and filter them progressively
        let filteredDoctors = baseDoctors.filter(doctor => {
            // Apply all active filters
            if (departmentValue && doctor.department !== departmentValue) return false;
            if (doctorValue && doctor.name !== doctorValue) return false;
            if (chamberValue && (!doctor.chambers || !doctor.chambers.includes(chamberValue))) return false;
            if (dayValue && (!doctor.weekavailability || !doctor.weekavailability.some(s => s.day === dayValue))) return false;
            return true;
        });

        // Build available options from filtered doctors
        // filteredDoctors contains doctors that match current filter criteria
        filteredDoctors.forEach(doctor => {
            // Add all departments from filtered doctors
            availableDepartments.add(doctor.department);

            // Add all doctor names from filtered doctors
            availableDoctors.set(doctor.name, doctor.department);

            // Add all chambers from filtered doctors
            if (doctor.chambers && doctor.chambers.length > 0) {
                doctor.chambers.forEach(chamber => {
                    availableChambers.add(chamber);
                });
            }

            // Add all days from filtered doctors
            if (doctor.weekavailability && doctor.weekavailability.length > 0) {
                doctor.weekavailability.forEach(schedule => {
                    if (schedule.day) {
                        availableDays.add(schedule.day);
                    }
                });
            }
        });

        // If filter was cleared, reset dependent filters
        if (changedFilter) {
            const changedFilterValue = $('#' + changedFilter).val() || '';
            if (changedFilterValue === '') {
                // If department was cleared and doctor was selected, clear doctor too if invalid
                if (changedFilter === 'department' && doctorValue) {
                    // Keep doctor if its department is still in available departments
                    if (!availableDepartments.has(availableDoctors.get(doctorValue))) {
                        $('#doctor').val('').trigger('change.select2');
                    }
                }
            }
        }

        // Update dropdowns with available options, preserving current values if they're still valid
        const deptValueToUse = availableDepartments.has(departmentValue) ? departmentValue : '';
        const doctorValueToUse = availableDoctors.has(doctorValue) ? doctorValue : '';
        const chamberValueToUse = availableChambers.has(chamberValue) ? chamberValue : '';
        const dayValueToUse = availableDays.has(dayValue) ? dayValue : '';

        console.log('Available options:', {
            departments: [...availableDepartments],
            doctors: [...availableDoctors.keys()],
            chambers: [...availableChambers],
            days: [...availableDays]
        });

        this.populateDropdown('department', [...availableDepartments].sort(), deptValueToUse);
        this.populateDropdown('doctor', [...availableDoctors.keys()].sort(), doctorValueToUse);
        this.populateDropdown('chamber', [...availableChambers].sort(), chamberValueToUse);
        this.populateDropdown('day-filter', [...availableDays].sort(), dayValueToUse);

        this.updatingFilters = false; // Re-enable filter updates
        
        // Update sidebar when filters change (but only if we're not in the middle of an update)
        if (changedFilter) {
            // Get current filter values
            const deptValue = $('#department').val() || '';
            const doctorValue = $('#doctor').val() || '';
            const chamberValue = $('#chamber').val() || '';
            const dayValue = $('#day-filter').val() || '';
            
            // Only update sidebar if at least one filter is active
            if (deptValue || doctorValue || chamberValue || dayValue) {
                let sidebarFilteredDoctors = this.currentUser === 'admin' ? this.getChamberDoctors() : this.doctorsData;
                
                if (deptValue) {
                    sidebarFilteredDoctors = sidebarFilteredDoctors.filter(d => d.department === deptValue);
                }
                if (doctorValue) {
                    sidebarFilteredDoctors = sidebarFilteredDoctors.filter(d => d.name === doctorValue);
                }
                if (chamberValue) {
                    sidebarFilteredDoctors = sidebarFilteredDoctors.filter(d => 
                        d.chambers && d.chambers.includes(chamberValue)
                    );
                }
                if (dayValue) {
                    sidebarFilteredDoctors = sidebarFilteredDoctors.filter(d => 
                        d.weekavailability && d.weekavailability.some(s => s.day === dayValue)
                    );
                }
                
                this.updateChamberSidebar(sidebarFilteredDoctors);
            } else {
                // No filters active, show all chambers
                this.updateChamberSidebar();
            }
        }
        
        // Auto-update department when doctor is selected (after flag is reset)
        if (changedFilter === 'doctor' && doctorValueToUse && availableDoctors.has(doctorValueToUse)) {
            const selectedDoctorDept = availableDoctors.get(doctorValueToUse);
            if (selectedDoctorDept && departmentValue !== selectedDoctorDept) {
                // Update the dropdown value without triggering change to avoid recursion
                this.updatingFilters = true;
                $('#department').val(selectedDoctorDept).trigger('change.select2');
                this.updatingFilters = false;
            }
        }
    }

    populateDropdown(selectId, options, preserveValue = null) {
        const select = document.getElementById(selectId);
        if (!select) return; // Safety check
        
        const currentValue = preserveValue !== null ? preserveValue : (select.value || '');
        
        // Store if current value exists in new options
        const valueExists = options.length > 0 && currentValue && options.includes(currentValue);
        
        // Get proper label
        const labels = {
            'department': 'Department',
            'doctor': 'Doctor',
            'chamber': 'Chamber',
            'day-filter': 'Day'
        };
        const label = labels[selectId] || selectId;
        
        // Destroy Select2 before modifying DOM
        if ($(select).hasClass('select2-hidden-accessible')) {
            $(select).select2('destroy');
        }
        
        // Clear and populate options
        select.innerHTML = `<option value="">-- Select ${label} --</option>`;
        
        if (options.length === 0) {
            // If no options, add a placeholder
            const noOption = document.createElement('option');
            noOption.value = '';
            noOption.textContent = `No ${label.toLowerCase()} found`;
            noOption.disabled = true;
            select.appendChild(noOption);
        } else {
            options.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option;
                optionElement.textContent = option;
                select.appendChild(optionElement);
            });
        }
        
        // Set value before reinitializing Select2
        if (valueExists && currentValue) {
            select.value = currentValue;
        } else {
            select.value = '';
        }
        
        // Reinitialize Select2
        $(select).select2({
            placeholder: `Select ${label}`,
            allowClear: true
        });
        
        // Reattach event listeners after Select2 reinitialization
        if (selectId === 'department' || selectId === 'doctor' || selectId === 'chamber' || selectId === 'day-filter') {
            $(select).off('change.select2 change');
            $(select).on('change.select2 change', () => {
                if (!this.updatingFilters) {
                    this.updateFilterOptions(selectId === 'day-filter' ? 'day' : selectId);
                }
            });
        }
    }

    searchDoctors() {
        const department = document.getElementById('department').value;
        const doctor = document.getElementById('doctor').value;
        const chamber = document.getElementById('chamber').value;
        const day = document.getElementById('day-filter').value;

        let filteredDoctors = this.currentUser === 'admin' ? this.getChamberDoctors() : this.doctorsData;

        if (department) {
            filteredDoctors = filteredDoctors.filter(d => d.department === department);
        }

        if (doctor) {
            filteredDoctors = filteredDoctors.filter(d => d.name === doctor);
        }

        if (chamber) {
            filteredDoctors = filteredDoctors.filter(d => 
                d.chambers && d.chambers.includes(chamber)
            );
        }

        if (day) {
            filteredDoctors = filteredDoctors.filter(d => 
                d.weekavailability && d.weekavailability.some(s => s.day === day)
            );
        }

        this.displayDoctors(filteredDoctors);
        this.updateChamberSidebar(filteredDoctors);
    }

    updateChamberSidebar(filteredDoctors = null) {
        const sidebar = document.getElementById('chamber-sidebar');
        if (!sidebar) return;

        // If no filtered doctors provided, use all doctors
        if (!filteredDoctors) {
            filteredDoctors = this.currentUser === 'admin' ? this.getChamberDoctors() : this.doctorsData;
        }

        // Get unique chambers from filtered doctors
        const chamberNames = new Set();
        filteredDoctors.forEach(doctor => {
            if (doctor.chambers && doctor.chambers.length > 0) {
                doctor.chambers.forEach(chamber => chamberNames.add(chamber));
            }
        });

        if (chamberNames.size === 0) {
            sidebar.innerHTML = '<p class="no-chambers">No chambers found for the selected filters</p>';
            return;
        }

        // Build chamber items with details from chambersData
        let sidebarHTML = '';
        const sortedChambers = [...chamberNames].sort();

        sortedChambers.forEach(chamberName => {
            const chamberData = this.chambersData.find(c => c.name === chamberName);
            const phone = chamberData ? (chamberData.phone || 'N/A') : 'N/A';
            
            // Try to extract address from chamber name if it contains location info
            // Otherwise use the chamber name itself or a default message
            let address = 'Address not available';
            if (chamberData && chamberData.address) {
                address = chamberData.address;
            } else {
                // Extract location from name if it contains location indicators
                const locationMatch = chamberName.match(/\((.*?)\)|U\.N\.Pur|Champadanga|Rajbalhat|Jangipara/i);
                if (locationMatch) {
                    const location = locationMatch[1] || locationMatch[0];
                    address = location;
                } else {
                    // Use chamber name as address hint
                    address = chamberName;
                }
            }

            sidebarHTML += `
                <div class="chamber-item">
                    <div class="chamber-name">${chamberName}</div>
                    <div class="chamber-details">
                        <div class="chamber-detail-item phone">
                            <strong>Phone:</strong>
                            <span>${phone}</span>
                        </div>
                        <div class="chamber-detail-item address">
                            <strong>Location:</strong>
                            <span>${address}</span>
                        </div>
                    </div>
                </div>
            `;
        });

        sidebar.innerHTML = sidebarHTML;
    }

    clearFilters() {
        $('#department').val('').trigger('change.select2');
        $('#doctor').val('').trigger('change.select2');
        $('#chamber').val('').trigger('change.select2');
        $('#day-filter').val('').trigger('change.select2');
        this.searchDoctors();
        this.updateChamberSidebar(); // Show all chambers when filters are cleared
    }

    // Display Functions
    displayDoctors(doctors) {
        const doctorGrid = document.getElementById('doctor-grid');
        doctorGrid.innerHTML = '';

        if (doctors.length === 0) {
            doctorGrid.innerHTML = '<p class="text-center">No doctors found</p>';
            return;
        }

        doctors.forEach(doctor => {
            const doctorCard = this.createDoctorCard(doctor);
            doctorGrid.appendChild(doctorCard);
        });
    }

    createDoctorCard(doctor) {
        const card = document.createElement('div');
        card.className = 'doctor-card';

        const chamberInfo = doctor.chambers ? 
            doctor.chambers.map(chamber => {
                const phone = this.getChamberPhone(chamber);
                return `${chamber} ${phone ? `(Phone: ${phone})` : ''}`;
            }).join(', ') : 'No chambers assigned';

        const availabilityInfo = doctor.weekavailability && doctor.weekavailability.length > 0 ?
            doctor.weekavailability.map(slot => 
                `${slot.day}: ${this.formatTimeArray(slot.time)}`
            ).join(' | ') : 'No schedule set';

        const isAdmin = this.currentUser === 'admin';
        const canEdit = isAdmin && (!this.currentAdminChamber || 
            (doctor.chambers && doctor.chambers.includes(this.currentAdminChamber)));

        card.innerHTML = `
            <div class="doctor-header">
                <div>
                    <div class="doctor-name">${doctor.name}</div>
                    <div class="doctor-department">${doctor.department}</div>
                </div>
                ${canEdit ? `
                    <div class="doctor-actions">
                        <button class="btn-primary" onclick="doctorSystem.editDoctor(${doctor.id})">Edit Schedule</button>
                        <button class="btn-danger" onclick="doctorSystem.deleteDoctor(${doctor.id})">Delete</button>
                    </div>
                ` : ''}
            </div>
            <div class="doctor-info">
                <div class="chamber-info">
                    <strong>Chambers:</strong> ${chamberInfo}
                </div>
                <div class="availability-info">
                    <strong>Availability:</strong> ${availabilityInfo}
                </div>
            </div>
        `;

        return card;
    }

    getChamberPhone(chamberName) {
        const chamber = this.chambersData.find(c => c.name === chamberName);
        return chamber ? chamber.phone : null;
    }

    formatTimeArray(times) {
        if (!times || !Array.isArray(times)) return 'N/A';
        
        return times.map(time => {
            if (typeof time === 'string' && time.includes(':')) {
                return this.convertTo12Hour([time]);
            }
            return time;
        }).join(', ');
    }

    convertTo12Hour(timeArray) {
        if (!Array.isArray(timeArray)) return 'N/A';
        
        return timeArray.map(time => {
            if (typeof time === 'string' && time.includes(':')) {
                const [hour, minute] = time.split(':');
                const hourInt = parseInt(hour, 10);
                const ampm = hourInt >= 12 ? 'PM' : 'AM';
                const displayHour = hourInt % 12 || 12;
                return `${displayHour}:${minute} ${ampm}`;
            }
            return time;
        }).join(', ');
    }

    // Availability Reset System
    startAvailabilityReset() {
        // Check every minute for Sunday 23:55
        setInterval(() => {
            this.checkAndResetAvailability();
        }, 60000);
    }

    checkAndResetAvailability() {
        const now = new Date();
        if (now.getDay() === 0 && now.getHours() === 23 && now.getMinutes() >= 55) {
            this.doctorsData.forEach(doctor => {
                if (doctor.defaultavailability && doctor.defaultavailability.length > 0) {
                    doctor.weekavailability = JSON.parse(JSON.stringify(doctor.defaultavailability));
                }
            });
            console.log('Doctor availability reset to default for new week');
        }
    }

    // Modal Management
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    }

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    }

    hideAllSections() {
        document.getElementById('login-section').classList.add('hidden');
        document.getElementById('admin-panel').classList.add('hidden');
        document.getElementById('filters').classList.add('hidden');
        document.getElementById('doctor-list').classList.add('hidden');
    }

    // Notification System
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showInfo(message) {
        this.showNotification(message, 'info');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '1rem 1.5rem',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '600',
            zIndex: '10000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease',
            maxWidth: '300px'
        });

        // Set background color based on type
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            info: '#06b6d4'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize the system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Enable Select2 for all dropdowns
    $('.select2').select2({
        placeholder: 'Select an option',
        allowClear: true
    });

    // Initialize the doctor management system
    window.doctorSystem = new DoctorManagementSystem();
});