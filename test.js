// test.js
document.addEventListener('DOMContentLoaded', function() {
    let currentQuestion = 0;
    const questions = document.querySelectorAll('.question');
    const nextButton = document.getElementById('nextButton');
    const skipButton = document.getElementById('skipButton');
    const submitContainer = document.getElementById('submitContainer');
    const currentQuestionSpan = document.getElementById('currentQuestion');
    const progressDots = document.querySelectorAll('.progress-dot');

    // Функция для проверки ответа
    function checkAnswer(questionIndex, selectedValue) {
        const inputs = document.querySelectorAll('#question_' + questionIndex + ' input[type="radio"]');
        let isCorrect = false;
        
        inputs.forEach(input => {
            if (parseInt(input.value) === parseInt(selectedValue)) {
                isCorrect = input.getAttribute('data-correct') === 'true';
            }
        });
        
        return isCorrect;
    }

    // Обновляем статус точки прогресса
    function updateProgressDot(questionIndex, status) {
        const dot = document.getElementById('dot_' + questionIndex);
        if (dot) {
            dot.className = 'progress-dot ' + status;
            dot.innerHTML = questionIndex + 1;
        }
    }

    // Показываем фидбек
    function showFeedback(questionIndex, isCorrect) {
        const feedback = document.getElementById('feedback_' + questionIndex);
        if (feedback) {
            if (isCorrect) {
                feedback.innerHTML = '✓ Правильно!';
                feedback.className = 'feedback correct';
            } else {
                feedback.innerHTML = '✗ Неправильно!';
                feedback.className = 'feedback incorrect';
            }
            feedback.style.display = 'block';
        }
    }

    // Сохраняем результат в скрытое поле
    function saveResult(questionIndex, result) {
        const resultField = document.getElementById('result_' + questionIndex);
        if (resultField) {
            resultField.value = result;
        }
    }

    // Проверяем, отвечен ли вопрос
    function isQuestionAnswered(questionIndex) {
        const inputs = document.querySelectorAll('#question_' + questionIndex + ' input[type="radio"]');
        return Array.from(inputs).some(input => input.checked);
    }

    function showQuestion(index) {
        questions.forEach((question, i) => {
            question.classList.remove('active');
            if (i === index) {
                question.classList.add('active');
            }
        });
        
        // Обновляем точки прогресса
        progressDots.forEach((dot, i) => {
            dot.classList.remove('current');
            if (i === index) {
                dot.classList.add('current');
            }
        });
        
        if (currentQuestionSpan) {
            currentQuestionSpan.textContent = index + 1;
        }
        
        // Обновляем состояние кнопок
        if (index === totalQuestions - 1) {
            if (nextButton) nextButton.style.display = 'none';
            if (skipButton) skipButton.style.display = 'none';
            if (submitContainer) submitContainer.style.display = 'block';
        } else {
            if (nextButton) nextButton.style.display = 'inline-block';
            if (skipButton) skipButton.style.display = 'inline-block';
            if (submitContainer) submitContainer.style.display = 'none';
        }
    }

    // Обработчик клика по варианту ответа
    function setupOptionClickHandlers() {
        document.querySelectorAll('.option').forEach(option => {
            option.addEventListener('click', function(e) {
                // Находим радио-кнопку внутри этого варианта
                const radio = this.querySelector('input[type="radio"]');
                if (radio && !radio.disabled) {
                    radio.checked = true;
                    
                    // Триггерим событие change для обновления UI
                    const event = new Event('change', { bubbles: true });
                    radio.dispatchEvent(event);
                }
            });
        });
    }

    if (nextButton) {
        nextButton.addEventListener('click', function() {
            // Проверяем, выбран ли ответ на текущем вопросе
            const isAnswered = isQuestionAnswered(currentQuestion);
            
            if (!isAnswered) {
                alert('Пожалуйста, выберите ответ перед переходом к следующему вопросу.');
                return;
            }
            
            // Получаем выбранный ответ и проверяем его
            const inputs = document.querySelectorAll('#question_' + currentQuestion + ' input[type="radio"]:checked');
            if (inputs.length > 0) {
                const selectedValue = inputs[0].value;
                const isCorrect = checkAnswer(currentQuestion, selectedValue);
                
                // Показываем фидбек
                showFeedback(currentQuestion, isCorrect);
                
                // Сохраняем результат в скрытое поле
                saveResult(currentQuestion, isCorrect ? 'correct' : 'incorrect');
                
                // Обновляем точку прогресса
                updateProgressDot(currentQuestion, isCorrect ? 'correct' : 'incorrect');
                
                // Отключаем кнопки на время показа фидбека
                nextButton.disabled = true;
                if (skipButton) skipButton.disabled = true;
                
                // Отключаем все радио-кнопки текущего вопроса
                document.querySelectorAll('#question_' + currentQuestion + ' input[type="radio"]').forEach(radio => {
                    radio.disabled = true;
                });
            }
            
            // Автоматический переход к следующему вопросу через 1.5 секунды
            setTimeout(() => {
                if (currentQuestion < totalQuestions - 1) {
                    currentQuestion++;
                    showQuestion(currentQuestion);
                    // Включаем кнопки обратно
                    nextButton.disabled = false;
                    if (skipButton) skipButton.disabled = false;
                }
            }, 1500);
        });
    }

    if (skipButton) {
        skipButton.addEventListener('click', function() {
            // Помечаем вопрос как пропущенный
            updateProgressDot(currentQuestion, 'skipped');
            saveResult(currentQuestion, 'skipped');
            
            if (currentQuestion < totalQuestions - 1) {
                currentQuestion++;
                showQuestion(currentQuestion);
            }
        });
    }

    // Обработчик клика по точкам прогресса
    progressDots.forEach(dot => {
        dot.addEventListener('click', function() {
            const questionIndex = parseInt(this.getAttribute('data-question'));
            // Проверяем, можно ли перейти к этому вопросу
            if (questionIndex <= currentQuestion) {
                currentQuestion = questionIndex;
                showQuestion(currentQuestion);
            } else {
                alert('Вы можете переходить только к уже пройденным вопросам.');
            }
        });
    });

    // Настройка обработчиков клика по вариантам ответов
    setupOptionClickHandlers();

    // Инициализация
    showQuestion(0);
});