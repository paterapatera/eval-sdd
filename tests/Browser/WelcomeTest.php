<?php

it('displays the welcome page for guests', function () {
    $page = visit('/');

    $page->assertSee('Log in')
        ->assertSee('Register');
});
