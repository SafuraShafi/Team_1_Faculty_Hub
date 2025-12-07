document.addEventListener('DOMContentLoaded', function () {
	var state = {
		step: 1,
		maxStep: 5,
		selection: {
			course: null,
			room: null,
			times: [],
			capacity: null,
			requestText: null,
		},
	};

	const courseSelect = document.getElementById('courseSelect');
	const roomSelect = document.getElementById('roomSelect');
	const panelCourseSelect = document.getElementById('panelCourseSelect');
	const panelTimeSelect = document.getElementById('panelTimeSelect');
	const panelRoomSelect = document.getElementById('panelRoomSelect');
	const submitRequestBtn = document.getElementById('submitRequest');
	const scheduleRequest = document.getElementById('scheduleRequest');
	const goBackBtn = document.getElementById('goBack');
	const nextBtn = document.getElementById('nextStep');
	const timeOptions = document.querySelectorAll('.time-opt');
	const capacitySelect = document.getElementById('capacitySelect');
	const reviewContainer = document.getElementById('reviewContainer');
	const submitScheduleBtn = document.getElementById('submitSchedule');
	const landingDiv = document.getElementById('landing');
	const wizardWrap = document.getElementById('wizardWrap');
	const startScheduleRequestBtn = document.getElementById('startScheduleRequestBtn');

	function saveRequestsToLocalStorage(entry) {
		try {
			var key = 'scheduleRequests';
			var existing = JSON.parse(localStorage.getItem(key) || '[]');
			
			if (entry.type === 'schedule-request' && !entry.status) {
				entry.status = 'pending';
			}
			
			existing.push(entry);
			localStorage.setItem(key, JSON.stringify(existing));
			
			try { 
				if (entry && entry.type === 'schedule-request' && typeof renderLandingSchedules === 'function') {
					renderLandingSchedules(); 
				}
			} catch (e) { }
			
			try { 
				if (typeof showToast === 'function') {
					var message = entry.type === 'schedule-request' ? 'Schedule Request Submitted!' : 'Saved';
					showToast(message); 
				}
			} catch (e) { }
		} catch (e) {
			console.error('Failed to save schedule request', e);
		}
	}

		if (submitRequestBtn) {
		submitRequestBtn.addEventListener('click', function () {
			var text = scheduleRequest.value.trim();
			if (!text) {
				alert('Please enter a request before submitting.');
				return;
			}
			const entry = { type: 'quick-request', text, ts: new Date().toISOString() };
			saveRequestsToLocalStorage(entry);
			// small visual confirmation
			submitRequestBtn.textContent = 'Submitted';
			submitRequestBtn.disabled = true;
			console.log('Saved quick schedule request:', entry);
			setTimeout(() => {
				submitRequestBtn.textContent = 'Submit';
				submitRequestBtn.disabled = false;
				scheduleRequest.value = '';
			}, 1500);
		});
	}





	function validateStep(step) {
		switch(step) {
			case 1:
				var course = (panelCourseSelect && panelCourseSelect.value) ? panelCourseSelect.value : (courseSelect ? courseSelect.value || null : null);
				if (!course) {
					return false;
				}
				if (isDuplicateCourse(course)) {
					showValidationError('You have already requested this course. Please select a different course.');
					return false;
				}
				return true;
			case 2:
				let times = [];
				if (panelTimeSelect && panelTimeSelect.value) {
					times = [panelTimeSelect.value];
				} else {
					timeOptions.forEach(cb => { if (cb.checked) times.push(cb.value); });
				}
				return times.length > 0;
			case 3:
				const room = (panelRoomSelect && panelRoomSelect.value) ? panelRoomSelect.value : null;
				return !!room;
			case 4:
				const capacity = capacitySelect ? capacitySelect.value || null : null;
				return !!capacity;
			default:
				return true;
		}
	}

	function updateNextButtonVisibility() {
		if (!nextBtn) return;
		
		const isValid = validateStep(state.step);
		if (isValid) {
			nextBtn.style.display = '';
			nextBtn.disabled = false;
		} else {
			nextBtn.style.display = 'none';
		}
	}

	function isDuplicateCourse(courseToCheck) {
		const existing = JSON.parse(localStorage.getItem('scheduleRequests') || '[]');
		return existing.some(req => req.type === 'schedule-request' && req.course === courseToCheck && req.status !== 'rejected');
	}

	function showValidationError(message) {
		// Remove any existing error message
		const existingError = document.querySelector('.validation-error');
		if (existingError) existingError.remove();
		
		// Create and show new error message
		const errorDiv = document.createElement('div');
		errorDiv.className = 'alert alert-danger validation-error mt-2';
		errorDiv.style.fontSize = '14px';
		errorDiv.style.padding = '8px 12px';
		errorDiv.textContent = message;
		
		// Insert inside the current step panel at the end
		const currentPanel = document.querySelector('.step-panel:not(.d-none)');
		if (currentPanel) {
			currentPanel.appendChild(errorDiv);
		}
		
		// Auto-remove after 5 seconds
		setTimeout(() => {
			if (errorDiv.parentNode) errorDiv.remove();
		}, 5000);
	}



	if (panelCourseSelect) {
		panelCourseSelect.addEventListener('change', updateNextButtonVisibility);
	}
	if (panelTimeSelect) {
		panelTimeSelect.addEventListener('change', updateNextButtonVisibility);
	}
	if (panelRoomSelect) {
		panelRoomSelect.addEventListener('change', updateNextButtonVisibility);
	}
	if (capacitySelect) {
		capacitySelect.addEventListener('change', updateNextButtonVisibility);
	}
	function showStep(s) {
		state.step = s;
		// hide all panels
		document.querySelectorAll('.step-panel').forEach(p => {
			p.classList.add('d-none');
			p.classList.remove('fade-in');
		});
		const panel = document.getElementById('step-' + s);
		if (panel) {
			panel.classList.remove('d-none');
			// small entrance animation
			setTimeout(() => panel.classList.add('fade-in'), 20);
		}

		if (goBackBtn) {
			if (s <= 1) goBackBtn.textContent = 'Back'; else goBackBtn.textContent = 'Go Back';
		}
		
		if (nextBtn) {
			if (s >= state.maxStep) {
				nextBtn.textContent = 'Submit Schedule Request';
				nextBtn.classList.add('btn-success');
				nextBtn.classList.remove('btn-primary');
			} else {
				nextBtn.textContent = 'Next';
				nextBtn.classList.add('btn-primary');
				nextBtn.classList.remove('btn-success');
			}
		}
		var errors = document.querySelectorAll('.validation-error');
		errors.forEach(error => error.remove());
		
		if (s === state.maxStep) renderReview();
		updateNextButtonVisibility();
		if (panel) {
			var focusable = panel.querySelector('select, input, textarea, button');
			if (focusable) focusable.focus({preventScroll:true});
		}
	}

	if (goBackBtn) { 
		goBackBtn.addEventListener('click', function () {
			if (state.step > 1) {
				showStep(state.step - 1);
			} else {
				if (wizardWrap && landingDiv && wizardWrap.style.display !== 'none') {
					wizardWrap.style.display = 'none';
					landingDiv.style.display = '';
					state.selection = { course: null, room: null, times: [], capacity: null, requestText: null };
					return;
				}
				window.location.href = 'index.html';
			}
		}); 
	}

	if (nextBtn) {
		nextBtn.addEventListener('click', function () {
			// Validate current step before proceeding
			if (!validateStep(state.step)) {
				return; // Stop if validation fails
			}
			
			collectStepInputs();
			
			if (state.step < state.maxStep) {
				showStep(state.step + 1);
			} else {
				nextBtn.disabled = true;
				nextBtn.textContent = 'Submitting...';
				
				var summary = {
					type: 'schedule-request',
					course: state.selection.course,
					room: state.selection.room,
					times: state.selection.times,
					capacity: state.selection.capacity,
					quickRequest: (scheduleRequest && scheduleRequest.value) ? scheduleRequest.value.trim() : null,
					status: 'pending',
					ts: new Date().toISOString()
				};
				setTimeout(() => {
					saveRequestsToLocalStorage(summary);
					console.log('Schedule request saved (via Finish):', summary);
					// show confirmation screen
					showConfirmation();
					// Reset flow and UI selections
					resetForm();
					// Re-enable button
					nextBtn.disabled = false;
					nextBtn.textContent = 'Submit Schedule Request';
				}, 1000);
			}
		});
	}
	
	function collectStepInputs() {
		if (state.step === 1) {
			// prefer the centered panel select when visible
			state.selection.course = (panelCourseSelect && panelCourseSelect.value) ? panelCourseSelect.value : (courseSelect ? courseSelect.value || null : null);
		} else if (state.step === 2) {
			// use centered panel select if present, otherwise fallback to checkboxes
			if (panelTimeSelect && panelTimeSelect.value) {
				state.selection.times = [panelTimeSelect.value];
			} else {
				const selected = [];
				timeOptions.forEach(cb => { if (cb.checked) selected.push(cb.value); });
				state.selection.times = selected;
			}
		} else if (state.step === 3) {
			// use the center dropdown for room selection
			state.selection.room = (panelRoomSelect && panelRoomSelect.value) ? panelRoomSelect.value : null;
		} else if (state.step === 4) {
			state.selection.capacity = capacitySelect ? capacitySelect.value || null : null;
		}
	}

	function resetForm() {
		state.selection = { course: null, room: null, times: [], capacity: null, requestText: null };
		if (courseSelect) courseSelect.value = '';
		if (panelCourseSelect) panelCourseSelect.value = '';
		if (roomSelect) roomSelect.value = '';
		if (panelRoomSelect) panelRoomSelect.value = '';
		if (panelTimeSelect) panelTimeSelect.value = '';
		timeOptions.forEach(cb => cb.checked = false);
		if (capacitySelect) capacitySelect.value = '';
		if (scheduleRequest) scheduleRequest.value = '';
		
		// Remove any validation errors
		const errors = document.querySelectorAll('.validation-error');
		errors.forEach(error => error.remove());
		
		// Reset to step 1
		showStep(1);
	}

	function renderReview() {
		if (!reviewContainer) return;
		const s = state.selection;
		const html = `
			<table class="table table-sm">
				<tbody>
					<tr><th>Course</th><td>${s.course || '—'}</td></tr>
					<tr><th>Times</th><td>${(s.times && s.times.length) ? s.times.join(', ') : '—'}</td></tr>
					<tr><th>Room</th><td>${s.room || '—'}</td></tr>
					<tr><th>Capacity</th><td>${s.capacity || '—'}</td></tr>
					<tr><th>Quick Request</th><td>${(scheduleRequest && scheduleRequest.value) ? scheduleRequest.value.trim() : '—'}</td></tr>
				</tbody>
			</table>
		`;
		reviewContainer.innerHTML = html;
	}

	// helper: show confirmation UI inside landing, hide wizard, registration, and navigation buttons
	function showConfirmation() {
		const conf = document.getElementById('confirmation');
		if (wizardWrap && landingDiv) {
			wizardWrap.style.display = 'none';
			landingDiv.style.display = '';
			// Hide the registration section when showing confirmation
			const regSection = document.querySelector('.col-lg-4 .text-center.mt-5');
			if (regSection) regSection.style.display = 'none';
			// Hide navigation buttons
			const wizardActions = document.querySelector('.wizard-actions');
			if (wizardActions) wizardActions.style.display = 'none';
		}
		if (conf) conf.style.display = '';
	}

	// wire confirm home button (on confirmation panel)
	const confirmHomeBtn = document.getElementById('confirmHomeBtn');
	if (confirmHomeBtn) {
		confirmHomeBtn.addEventListener('click', function () {
			// hide confirmation and return to schedule landing
			const conf = document.getElementById('confirmation');
			if (conf) conf.style.display = 'none';
			if (landingDiv) landingDiv.style.display = '';
			if (wizardWrap) wizardWrap.style.display = 'none';
			// Show the registration section and navigation buttons when going back
			const regSection = document.querySelector('.col-lg-4 .text-center.mt-5');
			if (regSection) regSection.style.display = '';
			const wizardActions = document.querySelector('.wizard-actions');
			if (wizardActions) wizardActions.style.display = 'flex';
		});
	}



	// render landing schedules from localStorage
	function renderLandingSchedules() {
		const tbody = document.getElementById('landingScheduleBody');
		if (!tbody) return;
		const all = JSON.parse(localStorage.getItem('scheduleRequests') || '[]');
		const schedules = all.filter(it => it && it.type === 'schedule-request');
		if (!schedules.length) {
			tbody.innerHTML = '<tr><td class="text-muted">No schedules yet</td><td></td><td></td><td></td></tr>';
			return;
		}
		
		// Parse course information properly
		const rows = schedules.map(s => {
			// Parse course string (e.g., "MATH-101" -> "MATH", "101")
			let courseName = '—';
			let courseNum = '—';
			if (s.course) {
				const parts = s.course.split('-');
				if (parts.length >= 2) {
					courseName = parts[0];
					courseNum = parts.slice(1).join('-');
				} else {
					courseName = s.course;
				}
			}
			
			const semester = 'Spring 2026'; // Default semester for new requests
			const status = s.status || 'pending';
			const statusClass = status === 'approved' ? 'success' : status === 'rejected' ? 'danger' : 'warning';
			const statusBadge = `<span class="badge bg-${statusClass}">${status.charAt(0).toUpperCase() + status.slice(1)}</span>`;
			
			return `<tr><td>${courseName}</td><td>${courseNum}</td><td>${semester}</td><td>${statusBadge}</td></tr>`;
		});
		tbody.innerHTML = rows.join('');
	}

	showStep(1);
	// populate landing schedule list from storage
	renderLandingSchedules();
	if (landingDiv && wizardWrap) {
		landingDiv.style.display = '';
		wizardWrap.style.display = 'none';
	}

	if (startScheduleRequestBtn) {
		startScheduleRequestBtn.addEventListener('click', function () {
			if (landingDiv && wizardWrap) {
				landingDiv.style.display = 'none';
				wizardWrap.style.display = '';
			}
			showStep(1);
		});
	}

	// show a small toast message in the corner
	function showToast(msg, timeout = 1800) {
		let t = document.getElementById('simpleToast');
		if (!t) {
			t = document.createElement('div');
			t.id = 'simpleToast';
			t.className = 'simple-toast';
			document.body.appendChild(t);
		}
		t.textContent = msg;
		t.classList.add('visible');
		setTimeout(() => t.classList.remove('visible'), timeout);
	}

	// highlight selected options in the center panel and mirror into the left column
	if (panelCourseSelect) {
		panelCourseSelect.addEventListener('change', function () {
			const leftSelect = courseSelect;
			if (leftSelect) leftSelect.value = panelCourseSelect.value;
			// small visual cue
			panelCourseSelect.classList.add('pulse');
			setTimeout(() => panelCourseSelect.classList.remove('pulse'), 500);
		});
	}

	// add a fade-in class to wizardWrap when it becomes visible
	const obs = new MutationObserver(() => {
		if (wizardWrap && wizardWrap.style.display !== 'none') wizardWrap.classList.add('visible'); else wizardWrap.classList.remove('visible');
	});
	if (wizardWrap) obs.observe(wizardWrap, { attributes: true, attributeFilter: ['style'] });
});