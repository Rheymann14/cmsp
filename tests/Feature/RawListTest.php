<?php

use App\Models\User;

test('guests are redirected to the login page', function () {
    $this->get('/raw_list')->assertRedirect('/login');
});

test('authenticated users can visit the raw list page', function () {
    $this->actingAs($user = User::factory()->create());

    $this->get('/raw_list')->assertOk();
});