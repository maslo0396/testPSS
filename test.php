<!DOCTYPE html>
<html lang="ru">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="test.css?v=<?php echo time(); ?>">
    <title>Тест</title>
</head>

<body>
    <div class="header">
        <h1>Тест</h1>
        <?php
        $selected_category = isset($_GET['category']) ? $_GET['category'] : 'Все категории';
        echo '<p><strong>Категория:</strong> ' . htmlspecialchars($selected_category) . '</p>';
        ?>
        <button class="back-button" onclick="window.location.href='index.html'">← Назад к выбору категории</button>
    </div>

    <?php
    // Получаем параметр файла из GET запроса (по умолчанию основной файл)
    $file_param = isset($_GET['file']) ? $_GET['file'] : 'questions';
    
    // Определяем путь к JSON файлу и настройки теста
    if ($file_param === 'ohrana_truda') {
        $json_file_path = 'ohrana_truda.json';
        $questions_per_test = 10;  // Для охраны труда - 10 вопросов
        $max_errors_allowed = 2;   // Для охраны труда - 2 ошибки
    } else {
        $json_file_path = 'questions.json';
        $questions_per_test = 20;  // Для обычных тестов - 20 вопросов
        $max_errors_allowed = 4;   // Для обычных тестов - 4 ошибки
    }

    // Проверяем существование файла
    if (!file_exists($json_file_path)) {
        die('Ошибка: Файл ' . $json_file_path . ' не найден');
    }

    // Загружаем содержимое файла
    $questions_json = file_get_contents($json_file_path);
    if ($questions_json === false) {
        die('Ошибка: Не удалось прочитать файл ' . $json_file_path);
    }

    // Декодируем JSON
    $questions = json_decode($questions_json, true);

    // Проверяем ошибки JSON
    if ($questions === null) {
        die('Ошибка: Неверный формат JSON файла ' . $json_file_path);
    }

    // Получаем выбранную категорию из GET параметра
    $selected_category = isset($_GET['category']) ? $_GET['category'] : '';

    // Функция для получения правильного пути к изображению
    function getImagePath($img_filename)
    {
        if (empty($img_filename)) {
            return '';
        }
        return 'img/' . $img_filename;
    }

    // Фильтруем вопросы по выбранной категории
    $filtered_questions = $questions;
    if (!empty($selected_category) && $selected_category !== 'Все категории') {
        $filtered_questions = array_filter($questions, function ($question) use ($selected_category) {
            return isset($question['categories']) && in_array($selected_category, $question['categories']);
        });
        // Переиндексируем массив
        $filtered_questions = array_values($filtered_questions);
    }

    // Используем сессию для сохранения порядка вопросов
    // Запускаем сессию только один раз в начале
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    // Генерируем уникальный ключ для этой категории теста (учитываем и файл)
    $session_key = 'test_questions_' . md5($selected_category . '_' . $file_param);

    // Обрабатываем отправку формы
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        // Получаем вопросы из сессии
        if (isset($_SESSION[$session_key])) {
            $test_questions = $_SESSION[$session_key];
        } else {
            die('Ошибка: Вопросы теста не найдены в сессии');
        }

        $score = 0;
        $total_questions = count($test_questions);
        $user_answers = [];
        $errors = 0;
        $question_results = []; // Массив для хранения результатов каждого вопроса

        // Собираем результаты ТОЛЬКО из скрытых полей
        foreach ($test_questions as $index => $question) {
            $question_name = 'question_' . $index;
            $result_name = 'result_' . $index;
            
            // Получаем ответ пользователя (если есть)
            if (isset($_POST[$question_name]) && $_POST[$question_name] !== '') {
                $user_answer = (int)$_POST[$question_name];
                $user_answers[$index] = $user_answer;
            } else {
                $user_answers[$index] = null;
            }
            
            // Получаем результат из скрытого поля
            if (isset($_POST[$result_name]) && $_POST[$result_name] !== '') {
                $result = $_POST[$result_name];
                if ($result === 'correct') {
                    $score++;
                    $question_results[$index] = 'correct';
                } elseif ($result === 'incorrect') {
                    $errors++;
                    $question_results[$index] = 'incorrect';
                } elseif ($result === 'skipped') {
                    $errors++;
                    $question_results[$index] = 'skipped';
                }
            } else {
                // Если нет результата в скрытом поле, считаем ошибкой
                $errors++;
                $question_results[$index] = 'incorrect';
            }
        }

        // Отладочная информация
        echo "<!-- Отладочная информация: -->";
        echo "<!-- Всего вопросов: " . $total_questions . " -->";
        echo "<!-- Правильных ответов: " . $score . " -->";
        echo "<!-- Ошибок: " . $errors . " -->";
        echo "<!-- Процент: " . round(($score / $total_questions) * 100, 2) . "% -->";

        // Определяем, сдал ли пользователь тест
        $passed = $errors <= $max_errors_allowed;

        // Выводим результаты
        echo '<div class="result">';
        echo '<h2>Результаты теста</h2>';

        // Показываем результат сдачи
        if ($passed) {
            echo '<div class="pass-fail pass">ТЕСТ СДАН</div>';
        } else {
            echo '<div class="pass-fail fail">ТЕСТ НЕ СДАН</div>';
        }

        echo '<p>Вы ответили правильно на <strong>' . $score . '</strong> из <strong>' . $total_questions . '</strong> вопросов</p>';
        echo '<div class="error-count">Допущено ошибок: <strong>' . $errors . '</strong> из допустимых ' . $max_errors_allowed . '</div>';
        echo '<p>Ваш результат: <strong>' . round(($score / $total_questions) * 100, 2) . '%</strong></p>';

        // Визуальная сводка результатов
        echo '<div class="results-summary">';
        echo '<h3>Сводка результатов:</h3>';
        echo '<div class="progress-dots">';
        foreach ($question_results as $index => $result) {
            $class = $result === 'correct' ? 'correct' : ($result === 'skipped' ? 'skipped' : 'incorrect');
            echo '<div class="progress-dot ' . $class . '">' . ($index + 1) . '</div>';
        }
        echo '</div>';
        echo '<p><span class="correct-answer">● Зеленый</span> - правильный ответ</p>';
        echo '<p><span class="incorrect-answer">● Красный</span> - неправильный ответ</p>';
        echo '<p><span style="color: #f39c12">● Оранжевый</span> - пропущенный вопрос</p>';
        echo '</div>';

        // Показываем правильные ответы
        echo '<h3>Подробные ответы:</h3>';
        foreach ($test_questions as $index => $question) {
            $result_class = $question_results[$index] === 'correct' ? 'correct' : ($question_results[$index] === 'skipped' ? 'skipped' : 'incorrect');
            $status_text = $question_results[$index] === 'correct' ? 'Правильно' : ($question_results[$index] === 'skipped' ? 'Пропущено' : 'Неправильно');
            
            echo '<div class="question result-question" style="display: block;">';
            echo '<p><strong>Вопрос ' . ($index + 1) . ':</strong> ' . $question['question'] . ' <span class="' . $result_class . '-answer">(' . $status_text . ')</span></p>';

            // Показываем изображение, если есть
            $image_path = getImagePath($question['img']);
            if (!empty($image_path) && file_exists($image_path)) {
                echo '<div class="question-image">';
                echo '<img src="' . $image_path . '" alt="Иллюстрация к вопросу">';
                echo '</div>';
            }

            $user_answer = isset($user_answers[$index]) ? $user_answers[$index] : null;
            $correct_answer = $question['correct'];

            echo '<div class="options result-options">';
            foreach ($question['options'] as $option_index => $option) {
                $is_correct = ($option_index === $correct_answer);
                $is_user_answer = ($option_index === $user_answer);

                $option_class = '';
                $icon = '';
                $label = '';
                
                if ($is_correct && $is_user_answer) {
                    // Пользователь ответил правильно
                    $option_class = 'correct-user-answer';
                    $icon = '✅';
                    $label = '<span class="answer-label correct-label">Ваш ответ - ПРАВИЛЬНО</span>';
                } elseif ($is_correct) {
                    // Правильный ответ (но пользователь не выбрал его)
                    $option_class = 'correct-answer-option';
                    $icon = '✅';
                    $label = '<span class="answer-label correct-label">Правильный ответ</span>';
                } elseif ($is_user_answer) {
                    // Пользователь ответил неправильно
                    $option_class = 'incorrect-user-answer';
                    $icon = '❌';
                    $label = '<span class="answer-label incorrect-label">Ваш ответ - НЕПРАВИЛЬНО</span>';
                } else {
                    // Обычный вариант
                    $option_class = 'neutral-answer';
                    $icon = '○';
                }

                echo '<div class="option result-option ' . $option_class . '">';
                echo '<span class="option-icon">' . $icon . '</span>';
                echo '<span class="option-text">' . htmlspecialchars($option) . '</span>';
                echo $label;
                echo '</div>';
            }
            echo '</div>';
            
            // Дополнительная информация о вопросе
            echo '<div class="question-info">';
            if ($question_results[$index] === 'skipped') {
                echo '<p class="skipped-info">❓ Вы пропустили этот вопрос</p>';
            } elseif ($question_results[$index] === 'incorrect' && $user_answers[$index] !== null) {
                echo '<p class="incorrect-info">Вы выбрали неправильный вариант</p>';
            }
            echo '</div>';
            
            echo '</div>';
        }

        // Очищаем сессию после показа результатов
        unset($_SESSION[$session_key]);

        // Кнопка "Пройти тест снова" с учетом файла
        echo '<div class="navigation">';
        if ($file_param === 'ohrana_truda') {
            echo '<button class="btn__replace" onclick="window.location.href=\'test.php?category=' . urlencode($selected_category) . '&file=ohrana_truda\'">Пройти тест снова</button>';
        } else {
            echo '<button class="btn__replace" onclick="window.location.href=\'test.php?category=' . urlencode($selected_category) . '\'">Пройти тест снова</button>';
        }
        echo ' ';
        echo '<button class="back-button" onclick="window.location.href=\'index.html\'">Назад к выбору категории</button>';
        echo '</div>';
        echo '</div>';
    } else {
        // Перемешиваем вопросы в случайном порядке только при первой загрузке
        shuffle($filtered_questions);

        // Ограничиваем количество вопросов
        $test_questions = array_slice($filtered_questions, 0, min($questions_per_test, count($filtered_questions)));

        // Сохраняем вопросы в сессии
        $_SESSION[$session_key] = $test_questions;

        // Показываем форму с вопросами
        if (count($test_questions) > 0) {
            // Добавляем параметр файла в action формы
            $form_action = '?category=' . urlencode($selected_category);
            if ($file_param === 'ohrana_truda') {
                $form_action .= '&file=ohrana_truda';
            }

            echo '<form method="POST" action="' . $form_action . '" id="testForm">';
            
            echo '<div class="progress">Прогресс: <span id="currentQuestion">1</span> / ' . count($test_questions) . '</div>';
            
            // Визуальный прогресс в виде точек
            echo '<div class="progress-dots" id="progressDots">';
            for ($i = 0; $i < count($test_questions); $i++) {
                $class = $i === 0 ? 'current' : '';
                echo '<div class="progress-dot ' . $class . '" data-question="' . $i . '" id="dot_' . $i . '">' . ($i + 1) . '</div>';
            }
            echo '</div>';

            foreach ($test_questions as $index => $question) {
                $is_active = $index === 0 ? 'active' : '';
                echo '<div class="question ' . $is_active . '" id="question_' . $index . '">';
                echo '<div class="question-counter">Вопрос ' . ($index + 1) . ' из ' . count($test_questions) . '</div>';
                echo '<p>' . htmlspecialchars($question['question']) . '</p>';

                // Показываем изображение, если есть
                $image_path = getImagePath($question['img']);
                if (!empty($image_path) && file_exists($image_path)) {
                    echo '<div class="question-image">';
                    echo '<img src="' . $image_path . '" alt="Иллюстрация к вопросу">';
                    echo '</div>';
                }

                echo '<div class="options">';

                foreach ($question['options'] as $option_index => $option) {
                    $is_correct = $option_index === $question['correct'] ? 'true' : 'false';
                    echo '<div class="option">';
                    echo '<input type="radio" id="q' . $index . '_o' . $option_index . '" 
                                name="question_' . $index . '" value="' . $option_index . '" 
                                data-correct="' . $is_correct . '">';
                    echo '<label for="q' . $index . '_o' . $option_index . '">' . htmlspecialchars($option) . '</label>';
                    echo '</div>';
                }

                echo '</div>';
                
                // Блок для отображения фидбека
                echo '<div class="feedback" id="feedback_' . $index . '" style="display: none;"></div>';
                
                // Скрытое поле для сохранения результата проверки
                echo '<input type="hidden" name="result_' . $index . '" id="result_' . $index . '" value="">';
                
                echo '</div>';
            }

            // Навигационные кнопки
            echo '<div class="navigation">';
            echo '<button type="button" class="nav-button skip" id="skipButton">Пропустить</button>';
            if (count($test_questions) > 1) {
                echo '<button type="button" class="nav-button" id="nextButton">Следующий вопрос →</button>';
            } else {
                echo '<button type="submit" class="nav-button submit">Завершить тест</button>';
            }
            echo '</div>';

            // Кнопка завершения
            echo '<div class="navigation" id="submitContainer" style="display: none;">';
            echo '<button type="submit" class="nav-button submit">Завершить тест и проверить ответы</button>';
            echo '</div>';

            echo '</form>';

            // Передаем данные в JavaScript
            echo '<script>';
            echo 'const totalQuestions = ' . count($test_questions) . ';';
            echo '</script>';
            
            // Подключаем внешние файлы
            echo '<script src="test.js?v=' . time() . '"></script>';
        } else {
            echo '<div class="result">';
            echo '<p>Нет вопросов в выбранной категории.</p>';
            echo '<button class="back-button" onclick="window.location.href=\'index.html\'">Назад к выбору категории</button>';
            echo '</div>';
        }
    }
    ?>
</body>

</html>