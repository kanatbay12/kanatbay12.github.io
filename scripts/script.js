document.addEventListener("DOMContentLoaded", () => {
        // ================== Глобальное состояние приложения ==================
        let allAppointments = [];
        let selectedDate = new Date().toISOString().split("T")[0];
        let currentView = "grid"; // 'grid', 'list', 'chart'

        // ================== Константы и данные ==================
        const WORK_DAY_START_HOUR = 9;
        const WORK_DAY_END_HOUR = 20;
        const carData = {
          KIA: ["Rio", "Ceed", "Sportage", "K5", "Seltos"],
          Chevrolet: ["Cobalt", "Nexia", "Spark", "Damas", "Onix"],
          JAC: ["J7", "JS4", "S3", "T6"],
          Jetour: ["X70 Plus", "X90 Plus", "Dashing", "T2"],
        };

        // ================== DOM элементы ==================
        const bookingForm = document.getElementById("booking-form");
        const modal = document.getElementById("confirmation-modal");
        const modalTitle = document.getElementById("modal-title");
        const modalBody = document.getElementById("modal-body");
        const modalCancelBtn = document.getElementById("modal-cancel-btn");
        const modalConfirmBtn = document.getElementById("modal-confirm-btn");
        const scheduleDateInput = document.getElementById("scheduleDate");
        const scheduleViewContainer = document.getElementById("schedule-view-container");
        const appointmentDateInput = document.getElementById("appointmentDate");
        const appointmentTimeInput = document.getElementById("appointmentTime");
        const appointmentDurationInput = document.getElementById("appointmentDuration");
        const employeeSelect = document.getElementById("employee");
        const carBrandSelect = document.getElementById("carBrand");
        const carModelSelect = document.getElementById("carModel");
        const commentInput = document.getElementById("comment");
        const formError = document.getElementById("form-error");
        const viewSwitcher = document.getElementById("view-switcher");
        const prevDayBtn = document.getElementById("prev-day-btn");
        const nextDayBtn = document.getElementById("next-day-btn");

        function getEmployees() {
          return Array.from(employeeSelect.options).map((opt) => opt.value);
        }

        // ================== Функции рендеринга и UI ==================

        function populateTimeSelect() {
          appointmentTimeInput.innerHTML = "";
          for (let hour = WORK_DAY_START_HOUR; hour < WORK_DAY_END_HOUR; hour++) {
            const option = document.createElement("option");
            const timeString = `${String(hour).padStart(2, "0")}:00`;
            option.value = timeString;
            option.textContent = timeString;
            appointmentTimeInput.appendChild(option);
          }
        }

        function updateAvailableTimes() {
          const now = new Date();
          const todayString = now.toISOString().split("T")[0];
          const currentHour = now.getHours();

          const isToday = appointmentDateInput.value === todayString;

          Array.from(appointmentTimeInput.options).forEach((option) => {
            const optionHour = parseInt(option.value.split(":")[0]);
            if (isToday && optionHour < currentHour) {
              option.disabled = true;
            } else {
              option.disabled = false;
            }
          });

          if (appointmentTimeInput.options[appointmentTimeInput.selectedIndex]?.disabled) {
            const firstEnabledOption = Array.from(appointmentTimeInput.options).find((opt) => !opt.disabled);
            if (firstEnabledOption) {
              appointmentTimeInput.value = firstEnabledOption.value;
            }
          }
        }

        function populateCarBrands() {
          carBrandSelect.innerHTML = '<option value="">Выберите марку</option>';
          for (const brand in carData) {
            const option = document.createElement("option");
            option.value = brand;
            option.textContent = brand;
            carBrandSelect.appendChild(option);
          }
        }

        function updateCarModels() {
          const selectedBrand = carBrandSelect.value;
          carModelSelect.innerHTML = '<option value="">Выберите модель</option>';
          carModelSelect.disabled = true;

          if (selectedBrand && carData[selectedBrand]) {
            const models = carData[selectedBrand];
            models.forEach((model) => {
              const option = document.createElement("option");
              option.value = model;
              option.textContent = model;
              carModelSelect.appendChild(option);
            });
            carModelSelect.disabled = false;
          }
        }

        function renderActiveView() {
          switch (currentView) {
            case "grid":
              renderGridView();
              break;
            case "list":
              renderListView();
              break;
            case "chart":
              renderChartView();
              break;
          }
        }

        function renderGridView() {
          scheduleViewContainer.innerHTML = `<div id="daily-schedule-grid" class="schedule-grid"></div>`;
          const dailyScheduleGrid = document.getElementById("daily-schedule-grid");

          const employees = getEmployees();
          dailyScheduleGrid.style.gridTemplateColumns = `6rem repeat(${employees.length}, 1fr)`;

          const appointmentsForDay = allAppointments.filter((app) => app.date === selectedDate);

          const header = document.createElement("div");
          header.className = "grid-header contents";
          header.innerHTML =
            `<div class="p-2 text-center font-bold border-b-2 border-gray-600">Время</div>` +
            employees
              .map((emp) => `<div class="p-2 text-center font-bold border-b-2 border-gray-600">${emp}</div>`)
              .join("");
          dailyScheduleGrid.appendChild(header);

          const coveredSlots = new Set();
          const now = new Date();

          for (let hour = WORK_DAY_START_HOUR; hour < WORK_DAY_END_HOUR; hour++) {
            const timeCell = document.createElement("div");
            timeCell.className = "time-cell p-2 text-right font-semibold text-gray-400 border-r border-gray-700";
            timeCell.textContent = `${String(hour).padStart(2, "0")}:00`;
            dailyScheduleGrid.appendChild(timeCell);

            employees.forEach((employee, empIndex) => {
              const slotId = `${hour}-${empIndex}`;
              if (coveredSlots.has(slotId)) return;

              const appointment = appointmentsForDay.find((app) => {
                const appHour = parseInt(app.time.split(":")[0]);
                return app.employee === employee && appHour === hour;
              });

              const cell = document.createElement("div");

              if (appointment) {
                cell.setAttribute("draggable", "true");
                cell.dataset.appointmentId = appointment.id;

                const duration = parseInt(appointment.duration) || 1;
                for (let i = 0; i < duration; i++) {
                  if (hour + i < WORK_DAY_END_HOUR) {
                    coveredSlots.add(`${hour + i}-${empIndex}`);
                  }
                }

                const statusClasses = {
                  Запланировано: "cell-scheduled",
                  "В работе": "cell-in-progress",
                  Завершено: "cell-completed",
                  Отменено: "cell-cancelled",
                };
                const cellStatusClass = statusClasses[appointment.status] || "bg-gray-700";

                cell.className = `employee-cell p-2 rounded-lg flex flex-col justify-between relative ${cellStatusClass}`;
                cell.style.gridRow = `span ${duration}`;
                cell.style.gridColumn = `${empIndex + 2}`;

                const commentHTML = appointment.comment
                  ? `<div class="text-gray-300 text-xs italic truncate mt-1 flex items-start gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.839 8.839 0 01-4.082-.978l-1.804 1.804A1 1 0 013 17.207V15.5a1 1 0 01.293-.707l1.804-1.804A7.96 7.96 0 012 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM4.707 14.293L3 12.586V15a1 1 0 01-1-1v-2.586l-1.293-1.293a1 1 0 011.414-1.414L3 11.172l1.293-1.293a1 1 0 111.414 1.414L4.707 12.586z" clip-rule="evenodd" /></svg>
                                    <span class="truncate">${appointment.comment}</span>
                                   </div>`
                  : "";

                cell.innerHTML = `
                                <div class="text-xs overflow-hidden flex-grow">
                                    <div class="font-bold text-white truncate">${appointment.customerName}</div>
                                    <div class="text-gray-300 truncate flex items-center gap-1">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor"><path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.518.759a1.192 1.192 0 00-.113 1.948l1.757 3.512a1.192 1.192 0 001.948-.113l.759-1.518a1 1 0 011.06-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" /></svg>
                                        ${appointment.customerPhone}
                                    </div>
                                    <div class="text-gray-200 truncate">${appointment.carModel}</div>
                                    ${commentHTML}
                                </div>
                                <div class="mt-1">
                                    <span class="px-2 py-0.5 text-xs font-semibold rounded-full bg-black/30 block w-full text-center mb-1">${
                                      appointment.status
                                    }</span>
                                    <div class="flex gap-1 justify-center">
                                        ${
                                          appointment.status === "Запланировано"
                                            ? `<button data-id="${appointment.id}" class="btn-action-start btn btn-warning text-xs p-1 flex-grow" title="В работу">▶</button>
                                               <button data-id="${appointment.id}" class="btn-action-cancel btn btn-danger text-xs p-1 flex-grow" title="Отменить">✕</button>`
                                            : ""
                                        }
                                        ${
                                          appointment.status === "В работе"
                                            ? `<button data-id="${appointment.id}" class="btn-action-complete btn btn-success text-xs p-1 flex-grow" title="Завершить">✓</button>`
                                            : ""
                                        }
                                        ${
                                          appointment.status === "Завершено" || appointment.status === "Отменено"
                                            ? `<button data-id="${appointment.id}" class="btn-action-delete btn btn-danger text-xs p-1 flex-grow" title="Удалить навсегда">
                                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mx-auto" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
                                               </button>`
                                            : ""
                                        }
                                    </div>
                                </div>
                                <div class="resize-handle"></div>`;
              } else {
                const slotDate = new Date(`${selectedDate}T${String(hour).padStart(2, "0")}:00:00`);
                cell.style.gridRow = `span 1`;
                cell.style.gridColumn = `${empIndex + 2}`;

                if (slotDate < now) {
                  cell.className =
                    "employee-cell p-2 rounded-lg flex items-center justify-center bg-gray-900/20 border-2 border-dashed border-gray-800 cursor-not-allowed";
                  cell.innerHTML = `<span class="text-gray-700 text-lg">-</span>`;
                } else {
                  cell.className =
                    "employee-cell p-2 rounded-lg flex items-center justify-center bg-gray-900/50 border-2 border-dashed border-gray-700 hover:bg-gray-700 transition cursor-pointer btn-action-book-cell";
                  cell.dataset.time = `${String(hour).padStart(2, "0")}:00`;
                  cell.dataset.employee = employee;
                  cell.innerHTML = `<span class="text-gray-500 text-2xl pointer-events-none">+</span>`;
                }
              }
              dailyScheduleGrid.appendChild(cell);
            });
          }
        }

        function renderListView() {
          const appointmentsForDay = allAppointments
            .filter((app) => app.date === selectedDate)
            .sort((a, b) => a.time.localeCompare(b.time));

          let content = '<div class="space-y-3">';
          if (appointmentsForDay.length === 0) {
            content += '<p class="text-center text-gray-400 py-8">На эту дату записей нет.</p>';
          } else {
            appointmentsForDay.forEach((app) => {
              const statusClasses = {
                Запланировано: "border-blue-500",
                "В работе": "border-yellow-500",
                Завершено: "border-green-500",
                Отменено: "border-red-500",
              };
              const borderColor = statusClasses[app.status] || "border-gray-500";
              content += `
                            <div class="bg-gray-700 p-3 rounded-lg border-l-4 ${borderColor}">
                                <div class="flex justify-between items-start">
                                    <div>
                                        <p class="font-bold text-white">${app.time} - ${app.employee}</p>
                                        <p>${app.customerName} - ${app.carModel}</p>
                                        <p class="text-sm text-gray-300">${app.customerPhone}</p>
                                    </div>
                                    <span class="text-sm font-semibold px-2 py-1 bg-gray-600 rounded-full">${
                                      app.status
                                    }</span>
                                </div>
                                ${
                                  app.comment
                                    ? `<p class="text-sm italic text-gray-400 mt-2">Комментарий: ${app.comment}</p>`
                                    : ""
                                }
                            </div>
                        `;
            });
          }
          content += "</div>";
          scheduleViewContainer.innerHTML = content;
        }

        function renderChartView() {
          const appointmentsForDay = allAppointments.filter((app) => app.date === selectedDate);
          const employees = getEmployees();
          const totalHours = WORK_DAY_END_HOUR - WORK_DAY_START_HOUR;

          let content = '<div class="space-y-4">';
          employees.forEach((employee) => {
            content += `
                        <div>
                            <p class="font-bold mb-1">${employee}</p>
                            <div class="w-full bg-gray-700 rounded h-8 relative">`;

            const employeeAppointments = appointmentsForDay.filter((app) => app.employee === employee);
            employeeAppointments.forEach((app) => {
              const startHour = parseInt(app.time.split(":")[0]);
              const leftPercent = ((startHour - WORK_DAY_START_HOUR) / totalHours) * 100;
              const widthPercent = (app.duration / totalHours) * 100;
              const statusClasses = {
                Запланировано: "bg-blue-600",
                "В работе": "bg-yellow-600",
                Завершено: "bg-green-600",
                Отменено: "bg-red-600",
              };
              const bgColor = statusClasses[app.status] || "bg-gray-500";

              content += `
                            <div class="${bgColor} absolute h-full rounded text-white text-xs flex items-center justify-center overflow-hidden" 
                                 style="left: ${leftPercent}%; width: ${widthPercent}%;"
                                 title="${app.time}, ${app.customerName}, ${app.carModel}">
                                 <span class="truncate px-1">${app.customerName}</span>
                            </div>
                        `;
            });

            content += `</div></div>`;
          });
          content += "</div>";
          scheduleViewContainer.innerHTML = content;
        }

        // ================== Функции для работы с данными ==================

        function addAppointment(newAppointment) {
          allAppointments.push(newAppointment);
          renderActiveView();
        }

        function updateAppointmentStatus(id, newStatus) {
          const appointment = allAppointments.find((app) => app.id === id);
          if (appointment) {
            appointment.status = newStatus;
            renderActiveView();
          }
        }

        function deleteAppointment(id) {
          allAppointments = allAppointments.filter((app) => app.id !== id);
          renderActiveView();
        }

        // ================== Модальное окно ==================
        let confirmCallback = null;
        function showConfirmationModal(title, body, confirmClass, callback) {
          modalTitle.textContent = title;
          modalBody.textContent = body;
          modalConfirmBtn.className = `btn ${confirmClass}`;
          confirmCallback = callback;
          modal.classList.remove("hidden");
        }
        function hideModal() {
          modal.classList.add("hidden");
          confirmCallback = null;
        }

        // ================== Обработчики событий ==================
        bookingForm.addEventListener("submit", (e) => {
          e.preventDefault();
          formError.classList.add("hidden");

          const selectedTime = appointmentTimeInput.value;
          const selectedDateValue = appointmentDateInput.value;
          const selectedDateTime = new Date(`${selectedDateValue}T${selectedTime}`);

          if (selectedDateTime < new Date()) {
            formError.textContent = `Ошибка: Нельзя создать запись на прошедшее время.`;
            formError.classList.remove("hidden");
            return;
          }

          const selectedHour = parseInt(selectedTime.split(":")[0]);
          const duration = parseInt(appointmentDurationInput.value) || 1;
          const brand = carBrandSelect.value;
          const model = carModelSelect.value;

          if (selectedHour + duration > WORK_DAY_END_HOUR) {
            formError.textContent = `Ошибка: Запись выходит за рамки рабочего дня (до ${WORK_DAY_END_HOUR}:00).`;
            formError.classList.remove("hidden");
            return;
          }
          if (!brand || !model) {
            formError.textContent = "Пожалуйста, выберите марку и модель автомобиля.";
            formError.classList.remove("hidden");
            return;
          }

          const newAppointment = {
            id: crypto.randomUUID(), // Генерируем уникальный ID
            customerName: document.getElementById("customerName").value,
            customerPhone: document.getElementById("customerPhone").value,
            carModel: `${brand} ${model}`,
            serviceType: document.getElementById("serviceType").value,
            date: selectedDateValue,
            time: selectedTime,
            duration: duration,
            employee: employeeSelect.value,
            status: "Запланировано",
            comment: commentInput.value,
          };

          addAppointment(newAppointment);

          bookingForm.reset();
          appointmentDateInput.value = new Date().toISOString().split("T")[0];
          populateTimeSelect();
          updateAvailableTimes();
          populateCarBrands();
          updateCarModels();
        });

        scheduleViewContainer.addEventListener("click", (e) => {
          const buttonTarget = e.target.closest("button");
          if (buttonTarget) {
            const id = buttonTarget.dataset.id;
            if (buttonTarget.classList.contains("btn-action-cancel")) {
              showConfirmationModal("Отменить запись?", "Статус будет изменен на 'Отменено'.", "btn-danger", () =>
                updateAppointmentStatus(id, "Отменено")
              );
            } else if (buttonTarget.classList.contains("btn-action-start")) {
              updateAppointmentStatus(id, "В работе");
            } else if (buttonTarget.classList.contains("btn-action-complete")) {
              updateAppointmentStatus(id, "Завершено");
            } else if (buttonTarget.classList.contains("btn-action-delete")) {
              showConfirmationModal("Удалить запись?", "Это действие нельзя будет отменить.", "btn-danger", () =>
                deleteAppointment(id)
              );
            }
          }

          const bookCell = e.target.closest(".btn-action-book-cell");
          if (bookCell) {
            const currentlySelected = scheduleViewContainer.querySelector(".slot-selected");
            if (currentlySelected) {
              currentlySelected.classList.remove("slot-selected");
            }
            bookCell.classList.add("slot-selected");

            appointmentDateInput.value = selectedDate;
            appointmentTimeInput.value = bookCell.dataset.time;
            employeeSelect.value = bookCell.dataset.employee;
            document.getElementById("customerName").focus();
          }
        });

        modalCancelBtn.addEventListener("click", hideModal);
        modalConfirmBtn.addEventListener("click", () => {
          if (confirmCallback) confirmCallback();
          hideModal();
        });

        // ================== Drag and Drop Logic ==================
        let draggedAppointmentId = null;

        scheduleViewContainer.addEventListener("dragstart", (e) => {
          if (currentView !== "grid") return;
          const targetCell = e.target.closest('.employee-cell[draggable="true"]');
          if (targetCell && targetCell.dataset.appointmentId) {
            draggedAppointmentId = targetCell.dataset.appointmentId;
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", draggedAppointmentId);
            setTimeout(() => {
              targetCell.classList.add("dragging");
            }, 0);
          }
        });

        scheduleViewContainer.addEventListener("dragend", (e) => {
          if (currentView !== "grid") return;
          const targetCell = e.target.closest('.employee-cell[draggable="true"]');
          if (targetCell) {
            targetCell.classList.remove("dragging");
          }
          draggedAppointmentId = null;
        });

        scheduleViewContainer.addEventListener("dragover", (e) => {
          if (currentView !== "grid") return;
          e.preventDefault();
          const targetCell = e.target.closest(".employee-cell");
          if (targetCell && targetCell.classList.contains("btn-action-book-cell")) {
            targetCell.classList.add("drag-over");
          }
        });

        scheduleViewContainer.addEventListener("dragleave", (e) => {
          if (currentView !== "grid") return;
          const targetCell = e.target.closest(".employee-cell");
          if (targetCell) {
            targetCell.classList.remove("drag-over");
          }
        });

        scheduleViewContainer.addEventListener("drop", (e) => {
          if (currentView !== "grid") return;
          e.preventDefault();
          const targetCell = e.target.closest(".employee-cell");
          if (!targetCell || !draggedAppointmentId) return;

          targetCell.classList.remove("drag-over");

          const appointmentToMove = allAppointments.find((app) => app.id === draggedAppointmentId);
          if (!appointmentToMove) return;

          if (!targetCell.classList.contains("btn-action-book-cell")) return;

          const newTime = targetCell.dataset.time;
          const newEmployee = targetCell.dataset.employee;
          const newHour = parseInt(newTime.split(":")[0]);
          const duration = parseInt(appointmentToMove.duration);

          // --- Проверка наложения ---
          let isCollision = false;
          for (let i = 0; i < duration; i++) {
            const checkHour = newHour + i;
            if (checkHour >= WORK_DAY_END_HOUR) {
              isCollision = true;
              break;
            }
            const conflictingAppointment = allAppointments.find(
              (app) =>
                app.id !== appointmentToMove.id &&
                app.date === selectedDate &&
                app.employee === newEmployee &&
                parseInt(app.time.split(":")[0]) < checkHour + 1 &&
                parseInt(app.time.split(":")[0]) + parseInt(app.duration) > checkHour
            );
            if (conflictingAppointment) {
              isCollision = true;
              break;
            }
          }

          if (isCollision) {
            formError.textContent = "Невозможно переместить: время занято или выходит за рамки рабочего дня.";
            formError.classList.remove("hidden");
            setTimeout(() => formError.classList.add("hidden"), 4000);
            return;
          }

          // Обновляем данные
          appointmentToMove.time = newTime;
          appointmentToMove.employee = newEmployee;

          renderActiveView();
          draggedAppointmentId = null;
        });

        // ================== Resize Logic ==================
        let isResizing = false;
        let resizingState = {};

        function handleResizeMouseDown(e) {
          if (currentView !== "grid" || !e.target.classList.contains("resize-handle")) return;

          e.preventDefault();
          e.stopPropagation();

          isResizing = true;
          const cell = e.target.closest(".employee-cell");
          const appointmentId = cell.dataset.appointmentId;
          const appointment = allAppointments.find((app) => app.id === appointmentId);

          resizingState = {
            id: appointmentId,
            cell: cell,
            initialY: e.clientY,
            initialDuration: parseInt(appointment.duration),
          };

          document.addEventListener("mousemove", handleResizeMouseMove);
          document.addEventListener("mouseup", handleResizeMouseUp);
        }

        function handleResizeMouseMove(e) {
          if (!isResizing) return;

          const deltaY = e.clientY - resizingState.initialY;
          const slotHeight = resizingState.cell.offsetHeight / resizingState.initialDuration;
          const durationChange = Math.round(deltaY / slotHeight);
          let newDuration = resizingState.initialDuration + durationChange;

          if (newDuration < 1) newDuration = 1;

          const appointment = allAppointments.find((app) => app.id === resizingState.id);
          const startHour = parseInt(appointment.time.split(":")[0]);

          if (startHour + newDuration > WORK_DAY_END_HOUR) {
            newDuration = WORK_DAY_END_HOUR - startHour;
          }

          // Проверка наложения при ресайзе
          let isCollision = false;
          for (let i = 1; i < newDuration; i++) {
            const checkHour = startHour + i;
            const conflictingAppointment = allAppointments.find(
              (app) =>
                app.id !== resizingState.id &&
                app.date === selectedDate &&
                app.employee === appointment.employee &&
                parseInt(app.time.split(":")[0]) === checkHour
            );
            if (conflictingAppointment) {
              isCollision = true;
              break;
            }
          }

          if (!isCollision) {
            resizingState.cell.style.gridRow = `span ${newDuration}`;
          }
        }

        function handleResizeMouseUp(e) {
          if (!isResizing) return;

          const finalHeight = resizingState.cell.offsetHeight;
          const slotHeight = finalHeight / parseInt(resizingState.cell.style.gridRow.split(" ")[1]);
          const deltaY = e.clientY - resizingState.initialY;
          const durationChange = Math.round(deltaY / slotHeight);
          let newDuration = resizingState.initialDuration + durationChange;

          if (newDuration < 1) newDuration = 1;

          const appointment = allAppointments.find((app) => app.id === resizingState.id);
          const startHour = parseInt(appointment.time.split(":")[0]);

          if (startHour + newDuration > WORK_DAY_END_HOUR) {
            newDuration = WORK_DAY_END_HOUR - startHour;
          }

          appointment.duration = newDuration;

          isResizing = false;
          resizingState = {};
          document.removeEventListener("mousemove", handleResizeMouseMove);
          document.removeEventListener("mouseup", handleResizeMouseUp);

          renderActiveView();
        }

        scheduleViewContainer.addEventListener("mousedown", handleResizeMouseDown);

        // ================== Инициализация приложения ==================
        function dateToYyyyMmDd(date) {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, "0");
          const day = String(date.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        }

        function updateSelectedDate(newDateString) {
          selectedDate = newDateString;
          scheduleDateInput.value = selectedDate;
          appointmentDateInput.value = selectedDate;
          updateAvailableTimes();
          renderActiveView();
        }

        function initializeApp() {
          appointmentDateInput.value = selectedDate;
          scheduleDateInput.value = selectedDate;

          appointmentDateInput.addEventListener("change", updateAvailableTimes);
          scheduleDateInput.addEventListener("change", (e) => {
            updateSelectedDate(e.target.value);
          });

          prevDayBtn.addEventListener("click", () => {
            const currentDate = new Date(selectedDate);
            currentDate.setDate(currentDate.getDate() - 1);
            updateSelectedDate(dateToYyyyMmDd(currentDate));
          });

          nextDayBtn.addEventListener("click", () => {
            const currentDate = new Date(selectedDate);
            currentDate.setDate(currentDate.getDate() + 1);
            updateSelectedDate(dateToYyyyMmDd(currentDate));
          });

          populateTimeSelect();
          updateAvailableTimes();
          populateCarBrands();
          carBrandSelect.addEventListener("change", updateCarModels);

          viewSwitcher.addEventListener("click", (e) => {
            const target = e.target.closest(".view-btn");
            if (target) {
              currentView = target.dataset.view;
              document.querySelector(".view-btn.active").classList.remove("active");
              target.classList.add("active");
              renderActiveView();
            }
          });

          renderActiveView();
        }

        initializeApp();
      });