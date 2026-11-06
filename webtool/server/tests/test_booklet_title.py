# -*- coding: utf-8 -*-
"""
Titles are letterspaced with soul, which spaces everything but braced groups.
A braced hyphen, though, made it drop the next letter: "Ski-Hochtour" came out
as "SKI-HOCHTOU" in the programme booklet.
"""
from server.models import Booklet


def test_titles_keep_the_letter_after_a_hyphen():
    assert Booklet.to_upper('Ski-Hochtour') == 'SKI-HOCHTOUR'


def test_other_marks_stay_braced():
    assert Booklet.to_upper('GTA 11/20') == 'GTA {1}{1}{/}{2}{0}'
