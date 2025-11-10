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

    // Обрабатываем ответ на вопрос (общая функция)
    function processAnswer(questionIndex) {
        // Проверяем, выбран ли ответ на текущем вопросе
        const isAnswered = isQuestionAnswered(questionIndex);
        
        if (!isAnswered) {
            return { processed: false, message: 'Пожалуйста, выберите ответ.' };
        }
        
        // Получаем выбранный ответ и проверяем его
        const inputs = document.querySelectorAll('#question_' + questionIndex + ' input[type="radio"]:checked');
        if (inputs.length > 0) {
            const selectedValue = inputs[0].value;
            const isCorrect = checkAnswer(questionIndex, selectedValue);
            
            // Показываем фидбек
            showFeedback(questionIndex, isCorrect);
            
            // Сохраняем результат в скрытое поле
            saveResult(questionIndex, isCorrect ? 'correct' : 'incorrect');
            
            // Обновляем точку прогресса
            updateProgressDot(questionIndex, isCorrect ? 'correct' : 'incorrect');
            
            // Отключаем все радио-кнопки текущего вопроса
            document.querySelectorAll('#question_' + questionIndex + ' input[type="radio"]').forEach(radio => {
                radio.disabled = true;
            });
            
            return { processed: true };
        }
        return { processed: false, message: 'Не удалось обработать ответ.' };
    }

    function showQuestion(index) {
        // Проверяем, что вопросы существуют
        if (questions.length === 0) return;
        
        questions.forEach((question, i) => {
            question.classList.remove('active');
            if (i === index) {
                question.classList.add('active');
            }
        });
        
        // Обновляем точки прогресса
        progressDots.forEach((dot, i) => {
            if (dot) {
                dot.classList.remove('current');
                if (i === index) {
                    dot.classList.add('current');
                }
            }
        });
        
        if (currentQuestionSpan) {
            currentQuestionSpan.textContent = index + 1;
        }
        
        // Обновляем состояние кнопок
        const totalQuestions = questions.length;
        const isLastQuestion = index === totalQuestions - 1;
        
        if (isLastQuestion) {
            if (nextButton) nextButton.style.display = 'none';
            if (skipButton) skipButton.style.display = 'none';
            if (submitContainer) submitContainer.style.display = 'block';
        } else {
            if (nextButton) nextButton.style.display = 'inline-block';
            if (skipButton) skipButton.style.display = 'inline-block';
            if (submitContainer) submitContainer.style.display = 'none';
        }
        
        // Включаем кнопки при переходе на новый вопрос
        if (nextButton) nextButton.disabled = false;
        if (skipButton) skipButton.disabled = false;
    }

    // Обработчик клика по варианту ответа
    function setupOptionClickHandlers() {
        document.querySelectorAll('.option').forEach(option => {
            option.addEventListener('click', function(e) {
                // Проверяем, не отключен ли уже вопрос
                const questionIndex = Array.from(questions).findIndex(q => q.contains(this));
                const inputs = document.querySelectorAll('#question_' + questionIndex + ' input[type="radio"]');
                const isDisabled = inputs[0] && inputs[0].disabled;
                
                if (!isDisabled) {
                    // Находим радио-кнопку внутри этого варианта
                    const radio = this.querySelector('input[type="radio"]');
                    if (radio) {
                        radio.checked = true;
                        
                        // Триггерим событие change для обновления UI
                        const event = new Event('change', { bubbles: true });
                        radio.dispatchEvent(event);
                    }
                }
            });
        });
    }

    if (nextButton) {
        nextButton.addEventListener('click', function() {
            // Обрабатываем ответ на текущий вопрос
            const result = processAnswer(currentQuestion);
            
            if (result.processed) {
                // Отключаем кнопки на время показа фидбека
                nextButton.disabled = true;
                if (skipButton) skipButton.disabled = true;
                
                // Автоматический переход к следующему вопросу через 1.5 секунды
                setTimeout(() => {
                    if (currentQuestion < questions.length - 1) {
                        currentQuestion++;
                        showQuestion(currentQuestion);
                    }
                }, 1500);
            } else {
                alert(result.message);
            }
        });
    }

    if (skipButton) {
        skipButton.addEventListener('click', function() {
            // Сохраняем результат как пропущенный
            saveResult(currentQuestion, 'skipped');
            
            // Помечаем вопрос как пропущенный
            updateProgressDot(currentQuestion, 'skipped');
            
            if (currentQuestion < questions.length - 1) {
                currentQuestion++;
                showQuestion(currentQuestion);
            } else {
                // Если это последний вопрос, показываем кнопку завершения
                if (nextButton) nextButton.style.display = 'none';
                if (skipButton) skipButton.style.display = 'none';
                if (submitContainer) submitContainer.style.display = 'block';
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

    // Обработчик для кнопки завершения теста
    const submitButton = document.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.addEventListener('click', function(e) {
            // Проверяем, все ли вопросы отвечены или пропущены
            let allProcessed = true;
            let unprocessedQuestions = [];
            const totalQuestions = questions.length;
            
            for (let i = 0; i < totalQuestions; i++) {
                const resultField = document.getElementById('result_' + i);
                if (!resultField || resultField.value === '') {
                    // Если вопрос не обработан, но на него есть ответ - обрабатываем его
                    if (isQuestionAnswered(i)) {
                        const result = processAnswer(i);
                        if (!result.processed) {
                            allProcessed = false;
                            unprocessedQuestions.push(i + 1);
                        }
                    } else {
                        allProcessed = false;
                        unprocessedQuestions.push(i + 1);
                    }
                }
            }
            
            if (!allProcessed) {
                e.preventDefault();
                if (unprocessedQuestions.length > 0) {
                    alert('Пожалуйста, ответьте на вопросы: ' + unprocessedQuestions.join(', ') + ' или пропустите их перед завершением теста.');
                } else {
                    alert('Пожалуйста, ответьте на все вопросы или пропустите их перед завершением теста.');
                }
            }
        });
    }

    // Настройка обработчиков клика по вариантам ответов
    setupOptionClickHandlers();

    // Проверяем, что есть вопросы для теста
    if (questions.length > 0) {
        // Инициализация
        showQuestion(0);
    } else {
        console.error('Вопросы для теста не найдены');
    }
});