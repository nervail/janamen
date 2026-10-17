<?php

namespace Database\Seeders;

use App\Models\Course;
use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;

class CourseSeeder extends Seeder
{
    public function run(): void
    {
        $data = json_decode(file_get_contents(database_path('seeders/data/courses.json')), true);

        foreach ($data['courses'] as $c) {
            $course = Course::create(Arr::only($c, ['slug', 'title', 'description']));

            foreach ($c['chapters'] as $ch) {
                $chapter = $course->chapters()->create(Arr::only($ch, ['position', 'title', 'content_md', 'pass_threshold']));

                foreach ($ch['questions'] as $q) {
                    $question = $chapter->questions()->create(Arr::only($q, ['position', 'text']));

                    foreach ($q['options'] as $o) {
                        $question->options()->create(Arr::only($o, ['position', 'text', 'is_correct']));
                    }
                }
            }
        }
    }
}