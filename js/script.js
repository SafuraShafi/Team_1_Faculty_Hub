// Central script for small schedule multi-step flow
document.addEventListener('DOMContentLoaded', function () {
	// Simple state container for the wizard
		const state = {
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
			const key = 'scheduleRequests';
			const existing = JSON.parse(localStorage.getItem(key) || '[]');
			existing.push(entry);
			localStorage.setItem(key, JSON.stringify(existing));
			// If it's a schedule request, refresh the landing list immediately
				try { if (entry && entry.type === 'schedule-request' && typeof renderLandingSchedules === 'function') renderLandingSchedules(); } catch (e) { /* ignore */ }
				// show a lightweight toast if available
				try { if (typeof showToast === 'function') showToast('Saved'); } catch (e) { /* ignore */ }
		} catch (e) {
			console.error('Failed to save schedule request', e);
		}
	}

		// Submit (right-column quick request) - saves a quick message to localStorage
	if (submitRequestBtn) {
		submitRequestBtn.addEventListener('click', function () {
			const text = scheduleRequest.value.trim();
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

		// Next/Go Back wiring: switch visible step panels and update button labels
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

			// expand center panel for single-column steps (1,2,4)
			const wrap = document.getElementById('wizardWrap');
			if (wrap) {
				if (s === 1 || s === 2 || s === 4) wrap.classList.add('full'); else wrap.classList.remove('full');
			}

			// update buttons
			if (s <= 1) goBackBtn.textContent = 'Back'; else goBackBtn.textContent = 'Go Back';
			// Use clearer submit wording on the final step
			if (s >= state.maxStep) nextBtn.textContent = 'Submit Schedule Request'; else nextBtn.textContent = 'Next';
			console.log('Wizard step:', s);
			// render review when on final step
			if (s === state.maxStep) renderReview();
			// focus first input inside the panel for accessibility
			if (panel) {
				const focusable = panel.querySelector('select, input, textarea, button');
				if (focusable) focusable.focus({preventScroll:true});
			}
		}

	if (goBackBtn) {
		goBackBtn.addEventListener('click', function () {
			if (state.step > 1) {
				showStep(state.step - 1);
			} else {
				// if wizard is visible, go back to landing; otherwise go to dashboard
				if (wizardWrap && landingDiv && wizardWrap.style.display !== 'none') {
					wizardWrap.style.display = 'none';
					landingDiv.style.display = '';
					// reset selection state
					state.selection = { course: null, room: null, times: [], capacity: null, requestText: null };
					return;
				}
				window.location.href = 'index.html';
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

		if (nextBtn) {
			nextBtn.addEventListener('click', function () {
				collectStepInputs();
				if (state.step < state.maxStep) {
					showStep(state.step + 1);
				} else {
					// Finalize: combine quick request text (if any) and save, then show confirmation
					const summary = {
						type: 'schedule-request',
						course: state.selection.course,
						room: state.selection.room,
						times: state.selection.times,
						capacity: state.selection.capacity,
						quickRequest: (scheduleRequest && scheduleRequest.value) ? scheduleRequest.value.trim() : null,
						ts: new Date().toISOString(),
					};
					saveRequestsToLocalStorage(summary);
					console.log('Schedule request saved (via Finish):', summary);
					// show confirmation screen
					showConfirmation();
					// Reset flow and UI selections
					state.selection = { course: null, room: null, times: [], capacity: null, requestText: null };
					if (courseSelect) courseSelect.value = '';
					if (roomSelect) roomSelect.value = '';
					timeOptions.forEach(cb => cb.checked = false);
					if (capacitySelect) capacitySelect.value = '';
					if (scheduleRequest) scheduleRequest.value = '';
				}
			});
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

		// wire submitSchedule button if present
		if (submitScheduleBtn) {
			submitScheduleBtn.addEventListener('click', function () {
				// collect any remaining inputs then save
				collectStepInputs();
				const final = {
					type: 'schedule-request',
					course: state.selection.course,
					room: state.selection.room,
					times: state.selection.times,
					capacity: state.selection.capacity,
					quickRequest: (scheduleRequest && scheduleRequest.value) ? scheduleRequest.value.trim() : null,
					ts: new Date().toISOString(),
				};
				saveRequestsToLocalStorage(final);
				console.log('Final schedule saved:', final);
				// show confirmation screen and hide wizard
				showConfirmation();
				// Reset selections
				state.selection = { course: null, room: null, times: [], capacity: null, requestText: null };
				if (courseSelect) courseSelect.value = '';
				if (roomSelect) roomSelect.value = '';
				timeOptions.forEach(cb => cb.checked = false);
				if (capacitySelect) capacitySelect.value = '';
				if (scheduleRequest) scheduleRequest.value = '';
			});
		}

		// render landing schedules from localStorage
		function renderLandingSchedules() {
			const tbody = document.getElementById('landingScheduleBody');
			if (!tbody) return;
			const all = JSON.parse(localStorage.getItem('scheduleRequests') || '[]');
			const schedules = all.filter(it => it && it.type === 'schedule-request');
			if (!schedules.length) {
				tbody.innerHTML = '<tr><td class="text-muted">No schedules yet</td><td></td><td></td></tr>';
				return;
			}
			// aggregate by course so we don't repeat the same class multiple times
			const byCourse = {};
			schedules.forEach(s => {
				const key = s.course || s.courseTitle;
				if (!key) return; // skip entries without course info
				if (!byCourse[key]) {
					byCourse[key] = { course: key, room: s.room || '—', capacity: s.capacity || '—' };
				}
			});

			// Build table HTML: single header row followed by one data row per course
			const headersHtml = '<tr class="schedule-headers"><th>Semester</th><th>Course Name</th><th>Course #</th><th>Seat Capacity</th></tr>';
			const rows = Object.values(byCourse).map(s => {
				const semester = s.semester || '—';
				const courseName = s.course || '—';
				const courseNum = s.courseNum || '—';
				return `<tr><td>${semester}</td><td>${courseName}</td><td>${courseNum}</td><td>${s.capacity}</td></tr>`;
			});
			tbody.innerHTML = headersHtml + rows.join('');
		}

		// Initialize
		// Initialize: show wizard panels state but keep wizard hidden until user starts
		showStep(1);
		// populate landing schedule list from storage
		renderLandingSchedules();
		if (landingDiv && wizardWrap) {
			landingDiv.style.display = '';
			wizardWrap.style.display = 'none';
		}

		// start wizard when CTA pressed
		if (startScheduleRequestBtn) {
			startScheduleRequestBtn.addEventListener('click', function () {
				if (landingDiv && wizardWrap) {
					landingDiv.style.display = 'none';
					wizardWrap.style.display = '';
				}
				showStep(1);
			});
		}

		// -----------------------------
		// UI niceties (non-functional enhancements)
		// -----------------------------

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

